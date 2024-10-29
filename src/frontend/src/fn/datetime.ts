import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import * as api from "@/api"
import * as datetime from "@/utils/datetime"
import CustomEventNames from "@/utils/events"

async function setDatetimeForSelectedDatasetHouse(elms: Elms, state: State) {
    const selectedDataset: string = elms.data.dataset.value;
    const selectedHouse: number = parseInt(elms.data.house.value);
    const selectedApp: string = elms.data.app.value;
    if (selectedDataset === "" || isNaN(selectedHouse) || selectedApp === "") return;

    const datetimeRangeParams: api.datetime.DatetimeRangeParams = {
        dataset: selectedDataset,
        house: selectedHouse,
        app: selectedApp,
    };

    // set datetime picker to the range of the data
    state.fullDataDatetimeRange = await api.datetime.getDatetimeRange(datetimeRangeParams);
    if (state.fullDataDatetimeRange !== null) {
        elms.data.pick.date.min = datetime.getDateFromSimpleDateTimeString(state.fullDataDatetimeRange.start);
        elms.data.pick.date.max = datetime.getDateFromSimpleDateTimeString(state.fullDataDatetimeRange.end)
    }
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    // update datetime upon selection of dataset/house/app
    window.addEventListener(
        CustomEventNames.NEW_EXP_SELECTED,
        async () => {
            await setDatetimeForSelectedDatasetHouse(elms, state)
        }
    )

    // either mains OR gt and NOT BOTH
    elms.data.modify.mains.enabled.addEventListener("change", () => {
        elms.data.modify.gt.enabled.checked = false
    })

    elms.data.modify.gt.enabled.addEventListener("change", () => {
        elms.data.modify.mains.enabled.checked = false
    })
}
