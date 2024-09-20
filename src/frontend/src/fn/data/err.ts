import State from "@/classes/state";
import Elms from "@/classes/elms";
import Trace from "@/classes/trace";
import Canvas from "@/classes/canvas";

import * as api from "@/api"
import * as  colors from "@/utils/colors";
import * as nav from "@/utils/nav"

import { originalTraces } from "./plot";

const barColor = '#4285F4';
const selectedBarColor = '#DB4437';

function drawHist(elms: Elms, state: State) {
    // ensure the response is not null
    if (state.currErrHistResponse === null) {
        return;
    }

    // get the selected bin
    let selectedBin = parseInt(elms.data.err.errBin.value);

    // ensure the selected bin is within the range
    if (selectedBin < 0 || selectedBin >= state.currErrHistResponse.hist.length) {
        selectedBin = state.currErrHistResponse.hist.length - 1;
    }

    // update info
    const formatErr = (err: number) => err.toFixed(2) + " " + (state.currErrHistResponse ? state.currErrHistResponse.unit : '');
    elms.data.err.info.range.from.innerText = formatErr(state.currErrHistResponse.bin_edges[selectedBin]);
    elms.data.err.info.range.to.innerText = formatErr(state.currErrHistResponse.bin_edges[selectedBin + 1]);
    elms.data.err.info.numWindows.innerText = state.currErrHistResponse.hist[selectedBin].toString();

    // draw the histogram
    const histCanvas = elms.data.err.errHistCanvas;
    const ctx = histCanvas.getContext('2d') as CanvasRenderingContext2D;
    const width = histCanvas.width;
    const height = histCanvas.height;
    const plotWidth = width;
    const plotHeight = height;

    // clear the canvas
    ctx.clearRect(0, 0, width, height);

    // find the maximum frequency to scale the bars
    const maxFreq = Math.max(...state.currErrHistResponse.hist);

    // scale factor to fit the bars within the canvas
    const scaleY = plotHeight / maxFreq;
    const scaleX = plotWidth / state.currErrHistResponse.hist.length;

    // Set the style for the histogram
    ctx.lineWidth = 0; // no border for the bars

    // Loop through the data and draw bars
    for (let i = 0; i < state.currErrHistResponse.hist.length; i++) {
        const barHeight = state.currErrHistResponse.hist[i] * scaleY;
        const barX = i * scaleX;
        const barY = height - barHeight;
        ctx.fillStyle = selectedBin == i ? selectedBarColor : barColor;
        ctx.fillRect(barX, barY, scaleX, barHeight);
    }
}

export async function updateErrHist(elms: Elms, state: State) {
    nav.disableNavElms();

    // disable err elements
    elms.data.err.numErrBins.disabled = true;
    elms.data.err.get.disabled = true;

    // get the selected number of error bins
    const numErrBins = parseInt(elms.data.err.numErrBins.value);

    // set the max value of the error bin input field
    elms.data.err.errBin.max = (numErrBins - 1).toString();

    // get hist data from backend
    const errHistResponse = await api.err.getErrHist({
        data_exp_name: elms.data.exp.value,
        app_name: elms.data.app.value,
        err_type: "MAE",
        bins: numErrBins,
    });
    state.currErrHistResponse = errHistResponse;

    // draw the histogram
    drawHist(elms, state);

    // re-enable the input field
    elms.data.err.numErrBins.disabled = false
    elms.data.err.get.disabled = false;

    nav.enableNavElms();
}

async function get(state: State, canvas: Canvas, elms: Elms) {
    state.reset();
    canvas.setLoading();
    nav.disableNavElms();

    // get selected error range
    const selectedBin = parseInt(elms.data.err.errBin.value);
    const errRange = {
        min: state.currErrHistResponse?.bin_edges[selectedBin],
        max: state.currErrHistResponse?.bin_edges[selectedBin + 1],
    };
    if (errRange.min === undefined || errRange.max === undefined) {
        throw new Error("Error range is undefined");
    }

    const commonAppDataParams = {
        data_exp_name: elms.data.exp.value,
        err_type: "MAE",
        err_min: errRange.min,
        err_max: errRange.max,
        duration_samples: parseInt(elms.data.err.durationSamples.value),
    }
    const dataParams: api.err.RndDataWithErrParams[] = [
        {
            ...commonAppDataParams,
            app_name: "mains",
        },
        {
            ...commonAppDataParams,
            app_name: elms.data.app.value,
        }
    ];

    const traces: Trace[] = [];
    for (let i = 0; i < dataParams.length; i++) {
        const { data, err, err_msg } = await api.err.getRndDataWithErr(dataParams[i]);
        if (err) {
            throw new Error(err_msg);
        }
        const trace = new Trace(0, dataParams[i].app_name, data, colors.getMatplotlibColor(i));
        traces.push(trace);
    }

    await state.setOriginalTraces(traces);
    nav.enableNavElms();
}

function canvasClickHandler(event: MouseEvent, elms: Elms, state: State) {
    // mouse x to error bin
    const width = elms.data.err.errHistCanvas.width;
    const x = event.offsetX;
    const nBins = parseInt(elms.data.err.numErrBins.value);

    const bin = Math.floor(x / width * nBins);
    elms.data.err.errBin.value = bin.toString();
    drawHist(elms, state);
}

export async function setupListeners(state: State, canvas: Canvas, elms: Elms) {
    elms.data.err.errHistCanvas.addEventListener("click", (event) => {
        canvasClickHandler(event, elms, state)
    })
    elms.data.err.numErrBins.addEventListener("change", () => updateErrHist(elms, state))
    elms.data.err.errBin.addEventListener("change", () => drawHist(elms, state))
    elms.data.err.get.addEventListener("click", async () => {
        await get(state, canvas, elms)
        await originalTraces(state, canvas, elms);
    });
}
