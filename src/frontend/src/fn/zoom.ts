import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import * as map from "@/utils/map"

import * as pick from "./data/pick"
import * as plot from "./data/plot"

async function zoom(state: State, canvas: Canvas, elms: Elms) {
    // disable modifying
    elms.data.modify.mains.enabled.checked = false;

    const fig = state.fig;
    if (fig === null) {
        alert("Fig is null");
        return;
    }

    const canvasElm = elms.draw.canvas;
    const ctx = canvasElm.getContext("2d");
    if (ctx === null) {
        alert("Canvas context is null");
        return;
    }

    if (state.zooming) {
        // disable zooming
        state.zooming = false;
        if (state.canvasImgDataBeforeZoom === null) return;
        ctx.putImageData(state.canvasImgDataBeforeZoom, 0, 0);
        return;
    }
    state.zooming = true;

    // overlay plot area with red transparent rectangle
    state.canvasImgDataBeforeZoom = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.fillRect(
        canvas.plotArea.x.min,
        canvas.plotArea.y.min,
        canvas.plotArea.width,
        canvas.plotArea.height,
    );

    // save start coordinates betwwen mouse down and up events
    let startX = 0;
    // wait for mouse drag and release event to select zoom area

    // mouse down event listener
    const downListener = (e: MouseEvent) => {
        canvasElm.removeEventListener("mousedown", downListener, true);
        canvasElm.addEventListener("mousemove", moveListener, true);
        startX = e.offsetX;
    }

    const moveListener = (e: MouseEvent) => {
        canvasElm.addEventListener("mouseup", upListerer, true);
        const x = e.offsetX;

        // adjust the red overlay: 
        if (state.canvasImgDataBeforeZoom === null) return;
        ctx.putImageData(state.canvasImgDataBeforeZoom, 0, 0);

        // section 1: red (pltStart to start)
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fillRect(
            canvas.plotArea.x.min,
            canvas.plotArea.y.min,
            startX - canvas.plotArea.x.min,
            canvas.plotArea.y.max,
        );

        // section 2: clear (start and current)
        // Nothing to do since we are using putImageData

        // section 3: red (current to pltEnd)
        ctx.fillRect(
            x,
            canvas.plotArea.y.min,
            canvas.plotArea.x.max - x,
            canvas.plotArea.y.max,
        );
    }

    const upListerer = async (e: MouseEvent) => {
        canvasElm.removeEventListener("mousemove", moveListener, true);
        canvasElm.removeEventListener("mouseup", upListerer, true);

        // get end coordinates
        const endX = e.offsetX;

        // calculate new start datetime
        const mainsTrace = fig.getTraceByName("mains");
        if (mainsTrace === undefined) {
            alert("Mains trace is undefined");
            return;
        }
        const xDates = Object.keys(mainsTrace.data)
        const newStartDatetimeIdx = map.canvasXToIdx({
            canvasX: startX,
            idxMin: 0,
            idxMax: xDates.length,
            canvasXMin: canvas.plotArea.x.min,
            canvasXMax: canvas.plotArea.x.max,
        });
        const newStartDatetimeStr = xDates[newStartDatetimeIdx]
        console.log(newStartDatetimeStr)
        const newStartDatetime = new Date(newStartDatetimeStr)

        // caculate duration in minutes
        const newEndDatetimeIdx = map.canvasXToIdx({
            canvasX: endX,
            idxMin: 0,
            idxMax: xDates.length,
            canvasXMin: canvas.plotArea.x.min,
            canvasXMax: canvas.plotArea.x.max,
        });
        const newEndDatetimeStr = xDates[newEndDatetimeIdx]
        const newEndDatetime = new Date(newEndDatetimeStr)
        const newDurationMs = newEndDatetime.getTime() - newStartDatetime.getTime();
        const newDurationSamples = Math.round(newDurationMs / 1000 / await state.getSampleDurationInSeconds());

        // adapt date and time pickers
        elms.data.pick.date.value = newStartDatetimeStr.split("T")[0];
        elms.data.pick.startTime.value = newStartDatetimeStr.split("T")[1].split(".")[0];
        elms.data.pick.durationSamples.value = newDurationSamples.toString();
        if (await pick.getData(state, elms)) {
            await plot.range(state, canvas, elms);
        }

        // reset state
        state.zooming = false;
    }

    canvasElm.addEventListener("mousedown", downListener, true);
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    elms.quickCtrl.zoom.addEventListener("click", async () => {
        await zoom(state, canvas, elms)
    })
}