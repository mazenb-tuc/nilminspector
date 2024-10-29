import State from "@/classes/state";
import Elms from "@/classes/elms";
import Canvas from "@/classes/canvas";
import Fig from "@/classes/fig";
import Trace from "@/classes/trace";

import * as api from "@/api"
import * as colors from "@/utils/colors"
import * as nav from "@/utils/nav"

export async function range(state: State, canvas: Canvas, elms: Elms) {
    const selectedDatetimeRange = state.getSelectedDatetimeRangOrThrow()
    const selectedDurationSamples = state.getSelectedDurationSamplesOrThrow()

    // get data from the backend
    nav.disableNavElms();
    state.reset();
    canvas.setLoading();

    const appParams = {
        start: selectedDatetimeRange.start,
        duration: `${selectedDurationSamples}m`,
        data_exp_name: elms.data.exp_name.value,
    }

    const dataParams: api.data.DataStartDurationParams[] = [
        {
            ...appParams,
            app_name: "mains",
        },
        {
            ...appParams,
            app_name: elms.data.app.value,
        },
    ];

    const traces: Trace[] = [];
    for (let i = 0; i < dataParams.length; i++) {
        const data = await api.data.getDataStartDuration(dataParams[i]);
        const trace = new Trace(0, dataParams[i].app_name, data, colors.getMatplotlibColor(i));
        traces.push(trace);
    }
    await state.setOriginalTraces(traces);
    await originalTraces(state, canvas, elms);
    nav.enableNavElms();
}

export async function originalTraces(state: State, canvas: Canvas, elms: Elms) {
    canvas.clear();
    state.fig = new Fig(elms, canvas, state, state.getOriginalTraces());
    state.fig?.plot();
}
