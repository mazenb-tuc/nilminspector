import os
from pathlib import Path
from dataclasses import dataclass
import re

from dotenv import load_dotenv
import joblib
from pydantic import BaseModel, ConfigDict

import enilm.datasets
import enilm.etypes
import enilm.appliances
import enilm.norm
import enilm.yaml.config


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


load_dotenv()
cache_folder = Path(os.environ["CACHE_FOLDER"])
all_exp_params_memory = joblib.Memory(cache_folder / "all_exp_params_memory", verbose=1)
exp_start_end_dates_memory = joblib.Memory(
    cache_folder / "exp_start_end_dates_memory", verbose=1
)


class ExpMem(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    data_cache_path: Path
    models_cache_path: Path
    memory: joblib.Memory


@dataclass
class AllExpParams:
    id: str
    dataset: str
    house: int
    app_name: str
    cache_dir_path: Path

    def get_data_path(self):
        # same for ds/house
        return self.cache_dir_path / "data" / self.dataset / str(self.house)

    def get_memory_cache_path(self):
        # same for ds/house
        return self.cache_dir_path / "joblib" / self.dataset / str(self.house)

    def get_models_cache_path(self):
        # for each exp
        return self.cache_dir_path / "models" / self.id


@all_exp_params_memory.cache
def _get_all_exp_params(exp_id: int, exp_num: int) -> AllExpParams:
    exp_count = 0

    for ds in enilm.etypes.Datasets:
        nilmtk_ds = enilm.datasets.get_nilmtk_dataset(ds)
        for building_idx in list(enilm.datasets.get_buildings(ds)):
            house = nilmtk_ds.buildings[building_idx]
            for appliance in house.elec.appliances:
                if exp_count == exp_id:
                    return AllExpParams(
                        id=f"A{exp_count:03d}",
                        dataset=ds.name,
                        house=building_idx,
                        app_name=enilm.appliances.to_label(appliance),
                        cache_dir_path=cache_folder / "nbs" / f"{exp_num}-all",
                    )
                exp_count += 1
    raise ValueError(f"Exp with id {exp_id} not found")


def get_exp_mem(exp_name: str) -> ExpMem:
    # x is the exp_num
    # y is the exp_id

    # is all exp? (a set of experiments for all datasets, houses and appliances)
    if exp_name.startswith("all-"):
        # expected exp_name format: "all-x-Ay"
        if re.match(r"all-\d+-A\d+", exp_name):
            exp_num = int(exp_name.split("-")[1])
            exp_id = int(exp_name.split("-")[2][1:])
            exp_params = _get_all_exp_params(exp_id, exp_num)
            return ExpMem(
                data_cache_path=exp_params.get_data_path(),
                models_cache_path=exp_params.get_models_cache_path(),
                memory=joblib.Memory(exp_params.get_memory_cache_path(), verbose=1),
            )
        else:
            raise ValueError(f"Invalid exp_name format: {exp_name}")

    # is exp set? (a set of experiments inside the same exp_num)
    if exp_name.startswith("set-"):
        # expected exp_name format: "all-x-y"
        if re.match(r"set-(\d+)-(.*)", exp_name):
            match = re.match(r"set-(\d+)-(.*)", exp_name)
            assert match is not None
            exp_num = int(match.group(1))
            exp_id = match.group(2)
            exp_par = cache_folder / "nbs" / f"{exp_num}-set"
            exp_file = exp_par / "exps" / f"{exp_id}.json"
            exp = Exp.model_validate_json(exp_file.read_text())
            return ExpMem(
                data_cache_path=exp_par / "data" / exp.dataset / str(exp.house),
                models_cache_path=exp_par / "models" / exp_id,
                memory=joblib.Memory(
                    exp_par / "joblib" / exp.dataset / str(exp.house), verbose=1
                ),
            )
        else:
            raise ValueError(f"Invalid exp_name format: {exp_name}")

    # single exp
    cache_dir_path = cache_folder / "nbs" / exp_name
    data_cache_path = cache_dir_path  # "/data" is added by enilm
    memory_cache_path = cache_dir_path / "joblib"
    models_cache_path = cache_dir_path / "models"
    memory = joblib.Memory(memory_cache_path, verbose=1)
    return ExpMem(
        data_cache_path=data_cache_path,
        models_cache_path=models_cache_path,
        memory=memory,
    )
