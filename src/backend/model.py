import importlib

import torch
import torch.nn as nn

from . import exps
from .mem import get_exp_mem


def get_model_for_exp(exp_name: str, device: torch.device) -> nn.Module:
    exp: exps.ModelExp = exps.get_model_exp_by_name(exp_name)

    # get model based on its class
    # model should only get sequence_length as an argument
    # exp.model_class e.g. 'enilm.models.torch.seq.S2P'
    model_class_path = ".".join(
        exp.model_class.split(".")[:-1]
    )  # -> 'enilm.models.torch.seq'
    model_name = exp.model_class.split(".")[-1]  # -> 'S2P'
    module = importlib.import_module(model_class_path)
    clazz = getattr(module, model_name)
    model = clazz(exp.sequence_length)

    # moving model to device
    model = model.to(device)

    # loading model weights
    full_models_weights_path = (
        get_exp_mem(exp_name).models_cache_path / exp.selected_model_weights
    )
    model.load_state_dict(torch.load(full_models_weights_path))

    return model

