import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import * as api from "@/api"
import * as colors from "@/utils/colors"


async function getFm(state: State, elms: Elms) {
    const mains_data = state.fig?.getTraceByName("mains")?.data;
    if (!mains_data) {
        alert("No mains data found");
        return;
    }

    const { activation } = await api.fm.get({
        input_data: mains_data,
        model_exp: elms.prediction.model.value,
        transposed: false,
    });

    // empty canvas container
    elms.fm.canvasContainer.innerHTML = "";

    // activation[layer_name] is two dimensional float array
    for (const layer in activation) {
        const fm = activation[layer]
        const container = document.createElement("div");

        // get min and max values in the activation for color scaling
        let fmMin = Math.min(...fm.flat());
        let fmMax = Math.max(...fm.flat());
        const getColor = (val: number) => colors.getInterpolatedRgbColor(val, fmMin, fmMax, colors.cmaps.plasma);

        // create title for canvas
        const title = document.createElement("p");
        title.appendChild(document.createTextNode(layer));
        container.appendChild(title);

        // create canvas element
        const canvas = document.createElement("canvas");
        container.appendChild(canvas);

        // draw fm as a heatmap on canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            alert("Failed to get canvas context");
            return;
        }
        const width = fm[0].length;
        const height = fm.length;

        // set canvas size
        canvas.width = parseInt(elms.fm.width.value)
        canvas.height = parseInt(elms.fm.height.value)

        const cellWidth = canvas.width / width;
        const cellHeight = canvas.height / height;

        // draw heatmap
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                ctx.fillStyle = getColor(fm[y][x]);
                ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            }
        }

        // color map
        {
            // new line
            container.appendChild(document.createElement("br"));

            // draw color map on a new canvas
            const colorMapCanvas = document.createElement("canvas");

            // set canvas size
            colorMapCanvas.width = parseInt(elms.fm.width.value);
            colorMapCanvas.height = 40;

            const ctx = colorMapCanvas.getContext("2d");
            if (!ctx) {
                alert("Failed to get canvas context");
                return;
            }

            // draw values in the upper half and color map in the lower half of the canvas
            const nSteps = 4;
            for (let act = fmMin; act < fmMax; act += (fmMax - fmMin) / nSteps) {
                const x = (act - fmMin) / (fmMax - fmMin) * colorMapCanvas.width;

                // draw value in the first quarter
                ctx.fillStyle = "black";
                ctx.fillText(act.toFixed(2), x, colorMapCanvas.height / 4);

                // draw tick in the second quarter
                ctx.beginPath();
                ctx.moveTo(x, colorMapCanvas.height / 4);
                ctx.lineTo(x, colorMapCanvas.height / 2);
                ctx.stroke();
            }

            // draw color map
            const gradient = ctx.createLinearGradient(0, 0, colorMapCanvas.width, 0);
            for (let i = 0; i < colors.cmaps.plasma.length; i++) {
                gradient.addColorStop(colors.cmaps.plasma[i].pos, colors.cmaps.plasma[i].color);
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, colorMapCanvas.height / 2, colorMapCanvas.width, colorMapCanvas.height / 2);

            // append color map canvas to the container
            container.appendChild(colorMapCanvas);
        }

        elms.fm.canvasContainer.appendChild(container);
    }
}


export async function setup(state: State, canvas: Canvas, elms: Elms) {
    // get feature map
    elms.fm.get.addEventListener("click", () => getFm(state, elms))
}