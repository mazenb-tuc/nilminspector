"""Feature maps API"""

from typing import Dict

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
import torch
from torch import nn
import numpy as np
from scipy.interpolate import interp1d
from loguru import logger

from ..types import RawDataDict, NPArray_1D, NPArray_2D
from ..model import get_model_for_exp
from ..utils import get_device
from .. import exps

router = APIRouter(prefix="/fm")


class GetFeatureMapParams(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    input_data: RawDataDict
    model_exp: str
    transposed: bool = False
    resample: bool = False  # TODO: implement
    average: bool = True  # TODO: implement


class GetFeatureMapResponse(BaseModel):
    activation: Dict[str, NPArray_2D]  # layer name -> 2d
    preds: NPArray_1D


def downsample_avg(data, new_size):
    data_array = np.array(data)
    # calculate the ratio of the old length to the new length
    ratios = np.linspace(0, len(data), num=new_size + 1, endpoint=True)

    # initialize the result array
    result = np.zeros(new_size)

    # compute the average for each segment defined by the ratios
    for i in range(new_size):
        # Start index is inclusive, end index is exclusive
        start_idx = int(np.floor(ratios[i]))
        end_idx = int(np.floor(ratios[i + 1]))
        result[i] = np.mean(data_array[start_idx:end_idx])

    return result


def upsample(data, new_size):
    x = np.linspace(0, len(data) - 1, num=len(data))
    f = interp1d(x, data, kind="linear")
    x_new = np.linspace(0, len(data) - 1, num=new_size)
    return f(x_new)


@router.post("/")
async def get_feature_map(params: GetFeatureMapParams) -> GetFeatureMapResponse:
    # load model of the exp
    exp: exps.ModelExp = exps.get_model_exp_by_name(params.model_exp)
    device: torch.device = get_device()
    model: nn.Module = get_model_for_exp(params.model_exp, device)
    model.eval()

    # prepare the input data: upsample or downsample to the expected sequence length
    input_data: np.ndarray = np.array(list(params.input_data.values()))
    if len(input_data) < exp.sequence_length:
        # upsample
        input_data = upsample(input_data, exp.sequence_length)
    elif len(input_data) > exp.sequence_length:
        # downsample
        input_data = downsample_avg(input_data, exp.sequence_length)
    assert input_data.size == exp.sequence_length

    # convert to torch tensor, reshape and move to the device of the model
    input_tensor = torch.tensor(input_data, dtype=torch.float32)
    input_tensor = input_tensor.reshape(
        (1, 1, exp.sequence_length)
    )  # batch_size, channels, sequence_length
    input_tensor = input_tensor.to(device)

    # sections/fm.ipynb
    # function to store feature maps
    activation = {}

    def get_activation(name):
        def hook(model, input, output):
            activation[name] = output.detach()

        return hook

    # register hooks on the convolution layers
    conv_layer_count = 0
    for layer in model.children():
        if isinstance(layer, nn.Conv1d) or isinstance(layer, nn.Conv2d):
            conv_layer_count += 1
            layer.register_forward_hook(get_activation(f"conv{conv_layer_count}"))
        if isinstance(layer, nn.Conv2d):
            # TODO
            logger.warning("Model with 2D Conver layers is not tested yet!")

    # perform a forward pass with the input tensor
    preds = model(input_tensor).detach()

    # convert to numpy arrays
    preds = preds.cpu().numpy().flatten()

    # convert to numpy arrays
    # note: without squeeze(), the shape of the activation tensor is (1, channels, channels)
    activation = {k: v.cpu().numpy().squeeze() for k, v in activation.items()}
    if params.transposed:
        activation = {k: v.T for k, v in activation.items()}

    return GetFeatureMapResponse(
        activation=activation,
        preds=preds,
    )
