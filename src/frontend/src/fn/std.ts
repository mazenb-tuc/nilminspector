import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"

import * as api from "@/api"

const replot = (state: State, canvas: Canvas, elms: Elms) => {
    canvas.clear()
    state.fig?.plot();
}

const updateThresholds = (state: State, canvas: Canvas, elms: Elms) => async () => {
    // ensure an experiment is selected
    if (elms.data.exp.value === "" || elms.data.exp.value === null) {
        alert("Please select an experiment first");
        return;
    }

    // get std watts
    state.stdWatts = await api.std.getStdWatts({
        std_threshold: parseFloat(elms.std.threshold.value),
        data_exp_name: elms.data.exp.value,
        app_name: "mains",
    })

    // update info span
    elms.std.watts.textContent = `${state.stdWatts.lower.toFixed(2)}W to ${state.stdWatts.upper.toFixed(2)}W`;
    elms.mean.watts.textContent = `${state.stdWatts.mean.toFixed(2)}`;

    replot(state, canvas, elms)
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    // update on inital load
    await updateThresholds(state, canvas, elms)()

    // update on change
    elms.std.threshold.addEventListener("change", updateThresholds(state, canvas, elms));

    // toggle show checkbox -> redraw
    elms.std.show.addEventListener("change", () => replot(state, canvas, elms));
}