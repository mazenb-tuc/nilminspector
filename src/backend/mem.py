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

from .types.exp import ModelExp

load_dotenv()
cache_folder = Path(os.environ["CACHE_FOLDER"])
joblib_verbose = int(os.environ["JOBLIB_VERBOSE"])

all_exp_params_memory = joblib.Memory(
    cache_folder / "all_exp_params_memory",
    verbose=joblib_verbose,
)
exp_start_end_dates_memory = joblib.Memory(
    cache_folder / "exp_start_end_dates_memory",
    verbose=joblib_verbose,
)
ds_house_dt_range_memory = joblib.Memory(
    cache_folder / "ds_house_dt_range_memory",
    verbose=joblib_verbose,
)
overview_daily_mean_memory = joblib.Memory(
    cache_folder / "overview_daily_mean_memory",
    verbose=joblib_verbose,
)


class ExpMem(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    data_cache_path: Path
    models_cache_path: Path
    memory: joblib.Memory


@dataclass
class AllExpParamsAFormat:
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
def _get_all_exp_params_aformat(exp_id: int, exp_num: int) -> AllExpParamsAFormat:
    exp_count = 0

    for ds in enilm.etypes.Datasets:
        nilmtk_ds = enilm.datasets.get_nilmtk_dataset(ds)
        for building_idx in list(enilm.datasets.get_buildings(ds)):
            house = nilmtk_ds.buildings[building_idx]
            for appliance in house.elec.appliances:
                if exp_count == exp_id:
                    return AllExpParamsAFormat(
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
        # expected exp_name format: "all-x-Ay" e.g. all-22-A003 (as in 22-all)
        if re.match(r"all-\d+-A\d+", exp_name):
            exp_num = int(exp_name.split("-")[1])
            exp_id = int(exp_name.split("-")[2][1:])
            exp_params = _get_all_exp_params_aformat(exp_id, exp_num)
            return ExpMem(
                data_cache_path=exp_params.get_data_path(),
                models_cache_path=exp_params.get_models_cache_path(),
                memory=joblib.Memory(exp_params.get_memory_cache_path(), verbose=1),
            )
        # expected exp_format: "all-x-ds-house-device" e.g. all-37-BLOND-1-Computer monitor 3 (as in 37-all)
        elif re.match(r"all-\d+-\w+-\d+-\w+", exp_name):
            exp_suffix = "all"

            exp_num = int(exp_name.split("-")[1])
            exp_ds = exp_name.split("-")[2]
            ds = enilm.etypes.Datasets[exp_ds]
            exp_house = int(exp_name.split("-")[3])
            app_name = "".join(exp_name.split("-")[4:])

            # see nbs/exps/37-all-no-model-1min/run.py:39
            cache_dir_path = (
                Path(os.environ["CACHE_FOLDER"]) / "nbs" / f"{exp_num}-{exp_suffix}"
            )

            # see nbs/exps/37-all-no-model-1min/run.py:110
            exp_id = f"{ds.name}-{exp_house}-{app_name}"

            # see nbs/exps/37-all-no-model-1min/run.py:69
            return ExpMem(
                data_cache_path=cache_dir_path / "data" / exp_ds / str(exp_house),
                models_cache_path=cache_dir_path / "models" / exp_id,
                memory=joblib.Memory(
                    cache_dir_path / "joblib" / exp_ds / str(exp_house)
                ),
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
            exp = ModelExp.model_validate_json(exp_file.read_text())
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
