import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import * as plot from "./plot"
import * as datetime from "@/utils/datetime"

export const getData = async (state: State, elms: Elms): Promise<boolean> => {
    // return true, if data is successfully fetched

    if (state.fullDataDatetimeRange === null) {
        alert("Datetime range not set");
        return false;
    }

    // date selected?
    if (elms.data.pick.date.value === "") {
        alert("Please select a date");
        return false;
    }

    // valid date selected (i.e. within the range of the data)
    const date = new Date(elms.data.pick.date.value);
    const startDate = new Date(state.fullDataDatetimeRange?.start)
    const endDate = new Date(state.fullDataDatetimeRange?.end)
    if (date <= startDate || date >= endDate) {
        alert("Please select a valid date");
        return false;
    }

    // valid start time selected
    const startTime = elms.data.pick.startTime.value;
    if (startTime === "") {
        alert("Please provide a start time");
        return false;
    }

    // valid duration selected
    const durationSamples = parseInt(elms.data.pick.durationSamples.value);
    if (isNaN(durationSamples)) {
        alert("Please provide a valid duration");
        return false;
    }
    if (durationSamples <= 0) {
        alert("Duration must be greater than 0");
        return false;
    }
    const selectedExp = state.getSelectedExpOrThrow()
    if (durationSamples < selectedExp.sequence_length) {
        alert(`Duration must be greater than one window of data (${state.getSelectedExpOrThrow().sequence_length} samples)`);
        return false;
    }

    // selected datetime into one date object
    const simpleDatetimeStr = `${elms.data.pick.date.value}T${startTime}`
    const durationMS = durationSamples * 1000 * await state.getSampleDurationInSeconds();
    await state.setSelectedDatetime(
        simpleDatetimeStr,
        // new Date(datetime.getTime() + durationMS)
        datetime.isoDateStringToSimpleDateString(new Date(new Date(simpleDatetimeStr).getTime() + durationMS).toISOString()),
        durationSamples,
    );

    return true;
}

export const loadCurrentDataDatetime = async (state: State, elms: Elms) => {
    const fig = state.fig;
    if (fig === null) {
        alert("Please plot data first");
        return;
    }

    const mainsTrace = fig.getTraceByName("mains");
    if (mainsTrace === undefined) {
        alert("Mains trace is undefined");
        return;
    }

    const mainsDates = Object.keys(mainsTrace.data)

    // get the earliest date
    if (mainsDates.length === 0) {
        alert("No data available");
        return;
    }
    let earliestDate = new Date(mainsDates[0]);
    for (const dateStr of mainsDates) {
        const date = new Date(dateStr);
        if (date < earliestDate) {
            earliestDate = date;
        }
    }

    // load date into date picker
    const firstDateStr = mainsDates[0]
    elms.data.pick.date.value = firstDateStr.split("T")[0];
    elms.data.pick.startTime.value = firstDateStr.split("T")[1].split(".")[0];

    // load duration into duration
    elms.data.pick.durationSamples.value = mainsDates.length.toString();
}


export function setupListeners(state: State, canvas: Canvas, elms: Elms) {
    elms.data.pick.get.addEventListener("click", async () => {
        if (await getData(state, elms)) {
            await plot.range(state, canvas, elms);
        }
    });
}