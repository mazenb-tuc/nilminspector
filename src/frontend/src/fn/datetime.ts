import Elms from "@/classes/elms"
import State from "@/classes/state"

import * as api from "@/api"
import * as datetime from "@/utils/datetime"

export async function setDatetimeForSelectedDatasetHouse(elms: Elms, state: State) {
    const selectedDataset: string = elms.data.dataset.value;
    const selectedHouse: number = parseInt(elms.data.house.value);
    if (selectedDataset === "" || isNaN(selectedHouse)) return;

    const datetimeRangeParams: api.datetime.DatetimeRangeParams = {
        exp_name: elms.data.exp.value,
    };


    // set datetime picker to the range of the data
    state.fullDataDatetimeRange = await api.datetime.getDatetimeRange(datetimeRangeParams);
    if (state.fullDataDatetimeRange !== null) {
        elms.data.pick.date.min = datetime.getDateFromSimpleDateString(state.fullDataDatetimeRange.start);
        elms.data.pick.date.max = datetime.getDateFromSimpleDateString(state.fullDataDatetimeRange.end)
    }
}