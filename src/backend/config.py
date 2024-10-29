import enilm.etypes
import enilm.yaml.data
import enilm.yaml.config

from . import exps
from .mem import get_exp_mem
from .consts import selected_gpu


def get_config(exp_name: str) -> enilm.yaml.config.Config:
    exp = exps.get_exp_by_name(exp_name)
    exp_mem = get_exp_mem(exp_name)

    config = enilm.yaml.config.Config(
        dataset=exp.dataset,
        house=exp.house,
        data_path=exp_mem.data_cache_path,
        selected_physical_quantity="power",
        selected_ac_type=exp.selected_ac_type,
        selected_apps=[exp.app],
        selected_gpu=selected_gpu,
        resample_params=exp.resample_params,
        manually_deleted_days=[],
        selected_n_samples_per_day=None,
        n_days=None,
    )

    # for exp with no model, selected_train_percent is irrelevant
    if isinstance(exp, exps.ModelExp):
        config.selected_train_percent = exp.selected_train_percent

    return config
