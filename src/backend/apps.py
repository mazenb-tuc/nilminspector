import nilmtk
from typing import Iterable

import enilm.appliances
import enilm.datasets.loaders

from .config import get_config


DATA_APP_NAME_TYPE = str


# see nbs/other/23-appname-for-data/23.ipynb
def find_matching_app_name_in_data_keys(
    data_exp_name: str,
    params_app_name: str,
    data_keys: Iterable[DATA_APP_NAME_TYPE],
) -> DATA_APP_NAME_TYPE:
    # in case of "mains" or exact match
    if params_app_name in data_keys:
        return params_app_name

    # find matching between:
    # 1. provided app_name and
    # 2. the available apps (keys) in the data
    # this is necessary because the app_name might be different from the key in the data
    # app_name is the label of the appliance as generated in get_all_apps from nilmtk.Applicance.label(True)

    # get nilmtk.Applicance object from app_name
    exp_config = get_config(data_exp_name)
    load_res = enilm.datasets.loaders.load(
        dataset=exp_config.dataset,
        building_nr=exp_config.house,
    )
    house_elec: nilmtk.MeterGroup = load_res.elec
    app_from_appname: nilmtk.Appliance = (
        enilm.appliances.get_appliance_by_label_name_from_nilmtk_metergroup(
            params_app_name, house_elec
        )
    )

    found_matching_app = False
    for app_in_data in data_keys:
        try:
            app_in_data_app = (
                enilm.appliances.get_appliance_by_label_name_from_nilmtk_metergroup(
                    app_in_data, house_elec
                )
            )
            if app_in_data_app.identifier == app_from_appname.identifier:
                found_matching_app = True
                break
        except ValueError:
            pass
    if not found_matching_app:
        raise ValueError(f"App {params_app_name} not found in data")

    return app_in_data
