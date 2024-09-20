import State from "@/classes/state"
import Elms from "@/classes/elms"
import Canvas from "@/classes/canvas"

import CustomEventNames from "@/events";

import * as predict from "./predict";

const mainsIsModefiedHandler = (state: State, canvas: Canvas, elms: Elms) => async () => {
    // auto predict if enabled
    if (elms.prediction.live.enabled.checked) {
        // grace period is valid?
        const gracePeridoSec = parseInt(elms.prediction.live.graceSec.value);
        if (isNaN(gracePeridoSec) || gracePeridoSec < 0) {
            alert("Please provide a valid grace period");
            return;
        }

        // ensure that the event is not triggered too often (e.g. every 1sec)
        if (state.autoPredictTimeout !== undefined) {
            clearTimeout(state.autoPredictTimeout);
        }
        state.autoPredictTimeout = setTimeout(() => predict.predict(state, canvas, elms), gracePeridoSec * 1000);
    }
}

export async function setupListeners(state: State, canvas: Canvas, elms: Elms) {
    // listeners for custom events
    window.addEventListener(
        CustomEventNames.MAINS_IS_MODIFIED,
        mainsIsModefiedHandler(state, canvas, elms),
    );
}