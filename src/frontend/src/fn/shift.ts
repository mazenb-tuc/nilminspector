import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import * as datetime from "@/utils/datetime"

import * as pick from "./data/pick"
import * as plot from "./data/plot"

async function getShiftDurationInMs(state: State, elms: Elms) {
    const shiftSec = elms.quickCtrl.shift;
    const shiftDurationInSamples = parseInt(shiftSec.durationSamples.value)
    const sampleDurationInSeconds = await state.getSampleDurationInSeconds();
    const shiftDurationInSeconds = shiftDurationInSamples * sampleDurationInSeconds;
    const shiftDurationInMS = shiftDurationInSeconds * 1000;
    return shiftDurationInMS
}

async function getShifftedData(state: State, canvas: Canvas, elms: Elms, shiftMs: number) {
    if (elms.data.pick.date.value === "" || elms.data.pick.startTime.value === "") {
        // load current data date and time
        await pick.loadCurrentDataDatetime(state, elms);
    }

    if (state.fullDataDatetimeRange === null) {
        throw new Error("fullDataDatetimeRange is undefined")
    }
    const fullDataDatetimeRange = state.fullDataDatetimeRange;

    const currentDate: string = elms.data.pick.date.value;
    const currentTime: string = elms.data.pick.startTime.value;
    const currentDatetime = new Date(`${currentDate}T${currentTime}`)
    const newDatetime = new Date(currentDatetime.getTime() + shiftMs);
    const end = new Date(fullDataDatetimeRange.end);
    const start = new Date(fullDataDatetimeRange.start);

    // enough data?
    if (shiftMs > 0) {
        if (state.fullDataDatetimeRange && newDatetime >= end) {
            alert("No next data available");
            return;
        }
    } else {
        if (state.fullDataDatetimeRange && newDatetime < start) {
            alert("No previous data available");
            return;
        }
    }

    // adapt date and time pickers
    const newDatetimeStr = datetime.dateToSimpleDateString(newDatetime);
    elms.data.pick.date.value = newDatetimeStr.split("T")[0];
    elms.data.pick.startTime.value = newDatetimeStr.split("T")[1].split(".")[0];
    if (await pick.getData(state, elms)) {
        await plot.range(state, canvas, elms);
    }
}



export async function setup(state: State, canvas: Canvas, elms: Elms) {
    const shiftSec = elms.quickCtrl.shift;

    shiftSec.next.addEventListener("click", async () => {
        const shiftDurationInMS = await getShiftDurationInMs(state, elms)
        await getShifftedData(state, canvas, elms, shiftDurationInMS)
    })
    shiftSec.prev.addEventListener("click", async () => {
        const shiftDurationInMS = await getShiftDurationInMs(state, elms)
        await getShifftedData(state, canvas, elms, -shiftDurationInMS)
    })

    shiftSec.nextDay.addEventListener("click", async () => {
        const sampleDurationInSeconds = await state.getSampleDurationInSeconds();
        const samplesPerDay = 24 * 60 * 60 / sampleDurationInSeconds;
        const shiftDurationInSamples = samplesPerDay;
        const shiftDurationInSeconds = shiftDurationInSamples * sampleDurationInSeconds;
        const shiftDurationInMS = shiftDurationInSeconds * 1000;

        await getShifftedData(state, canvas, elms, shiftDurationInMS)
    })
    shiftSec.prevDay.addEventListener("click", async () => {
        const sampleDurationInSeconds = await state.getSampleDurationInSeconds();
        const samplesPerDay = 24 * 60 * 60 / sampleDurationInSeconds;
        const shiftDurationInSamples = samplesPerDay;
        const shiftDurationInSeconds = shiftDurationInSamples * sampleDurationInSeconds;
        const shiftDurationInMS = shiftDurationInSeconds * 1000;

        await getShifftedData(state, canvas, elms, -shiftDurationInMS)
    })
}