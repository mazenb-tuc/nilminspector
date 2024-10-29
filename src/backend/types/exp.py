from pydantic import BaseModel, ConfigDict

import enilm.etypes
import enilm.norm
import enilm.yaml.config


class Exp(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    dataset: str  # enilm.etypes.DatasetID
    house: enilm.etypes.HouseNr
    app: enilm.etypes.AppName
    exp_name: str
    app_norm_params: enilm.norm.NormParams
    mains_norm_params: enilm.norm.NormParams
    selected_ac_type: enilm.yaml.config.ACTypes
    resample_params: enilm.yaml.config.ResampleParams
    on_power_threshold: float = 6.0  # watts
    description: str = ""


class ModelExp(Exp):  # Inherit from DataExp
    selected_model_weights: str
    sequence_length: int
    selected_train_percent: float
    batch_size: int
    num_epochs: int
    model_name: str
    model_class: str = "enilm.models.torch.seq.S2P"
    ds_class: str = "enilm.models.torch.seq.S2PDatasetMains"
