from typing import List, Iterable
from collections import Counter

from pydantic import BaseModel

import enilm.etypes
import enilm.norm
import enilm.yaml.config
import enilm.datasets
import enilm.appliances

from .mem import cache_folder


class Exp(BaseModel):
    dataset: str  # enilm.etypes.DatasetID
    house: enilm.etypes.HouseNr
    app: enilm.etypes.AppName
    exp_name: str
    app_norm_params: enilm.norm.NormParams
    mains_norm_params: enilm.norm.NormParams
    selected_model_weights: str
    sequence_length: int
    selected_ac_type: enilm.yaml.config.ACTypes
    resample_params: enilm.yaml.config.ResampleParams
    selected_train_percent: float
    batch_size: int
    num_epochs: int
    model_name: str
    description: str = ""
    on_power_threshold: float


def get_multi_exp_for(exp_name: str) -> Iterable[Exp]:
    # extend by all exps!
    exps_path = cache_folder / "nbs" / exp_name / "exps"
    for exp_file in exps_path.glob("*.json"):
        yield Exp.model_validate_json(exp_file.read_text())


all_exps: List[Exp] = [
    Exp.model_validate_json((cache_folder / "exp.json").read_text()),
]

# exp names must be unique
if len(all_exps) != len(set(dhe.exp_name for dhe in all_exps)):
    # print exp with same exp_name
    counted_exp_names = Counter([dhe.exp_name for dhe in all_exps])
    for exp_name, count in counted_exp_names.items():
        if count > 1:
            print(f"{exp_name} has {count} occurrences")
    raise RuntimeError("Exp names are not unique")


def get_exp_by_name(exp_name: str) -> Exp:
    for dhe in all_exps:
        if dhe.exp_name == exp_name:
            return dhe
    raise ValueError(f"Can't find exp by name: {exp_name}")
