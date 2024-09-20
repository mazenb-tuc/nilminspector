import State from "@/classes/state";
import Canvas from "@/classes/canvas";
import Elms from "@/classes/elms";
import Fig from "@/classes/fig";
import Trace from "@/classes/trace";

import * as api from "@/api";
import * as colors from "@/utils/colors";
import * as nav from "@/utils/nav";
import { updateModelInfo } from "./models";

export async function predict(state: State, canvas: Canvas, elms: Elms) {
    nav.disableNavElms()

    // check if mains data is loaded
    const mainsTrace = state.fig?.getTraceByName("mains");
    if (mainsTrace === undefined) return;
    if (mainsTrace?.data === undefined) return;

    // check that the data is long enough (i.e. > seq length)
    const selectedExp = state.getSelectedExpOrThrow()
    if (Object.keys(mainsTrace?.data).length < selectedExp.sequence_length) {
        alert(`Data is too short for prediction (need at least ${selectedExp.sequence_length} points)`);
        return;
    }

    // a model (identified by the exp name) must be selected
    if (elms.prediction.model.value === "") {
        alert("Select a model to predict with");
        return;
    }

    // get gt
    const gtTrace = state.fig?.getTraceByName(elms.data.app.value);
    if (gtTrace == undefined) {
        alert("Select a ground truth trace to predict");
        nav.enableNavElms();
        return;
    }
    if (gtTrace?.data === undefined) {
        alert("Ground truth data is not loaded");
        nav.enableNavElms();
        return;
    }

    // collect traces for the new fig (without the old prediction trace if it exists)
    if (state.fig?.traces === undefined) return;
    const newTraces = state.fig?.traces.filter((trace) => trace.name !== `${elms.data.app.value} pred`);

    // prediction from mains
    canvas.setLoading();
    const predictionResponse = await api.predict.getPrediction({
        data: mainsTrace?.data,
        app_name: gtTrace?.name,
        gt: gtTrace?.data,
        model_exp_name: elms.prediction.model.value,
    });
    const predTrace = new Trace(1, `${elms.data.app.value} pred`, predictionResponse.pred, colors.getMatplotlibColor(newTraces.length));

    // prediction error info
    elms.draw.info.innerHTML = "";

    // prediction errors
    if (predictionResponse.errors !== null) {
        const newErrors: { [key: string]: api.predict.PredictionError } = {}
        const errorList = document.createElement("ul");
        for (const error of predictionResponse.errors) {
            const li = document.createElement("li");
            li.appendChild(document.createTextNode(`${error.name}: ${error.value.toFixed(2)} ${error.unit}`));
            newErrors[error.name] = error;

            if (state.lastErrors && Object.keys(state.lastErrors).length > 0) {
                // for MAE: show change to previous error if exists and abs difference is bigger than 0.01
                if (error.name === "MAE") {
                    const prevError = state.lastErrors[error.name];
                    if (Math.abs(error.value - prevError.value) > 0.01) {
                        const span = document.createElement("span");
                        span.classList.add("ephemeral"); // should be saved in the snapshot
                        span.style.color = error.value > prevError.value ? "red" : "green";
                        const diff = Math.abs(error.value - prevError.value);
                        const diffSign = diff < 0 ? "+" : "-";
                        const textNode = document.createTextNode(` (${diffSign}${diff.toFixed(2)} ${error.unit})`)
                        span.appendChild(textNode);
                        li.appendChild(span);
                    }
                }

                // for F1: show change to previous error if exists and abs difference is bigger than 0.1
                else if (error.name === "F1" && state.lastErrors) {
                    const prevError = state.lastErrors[error.name];
                    if (Math.abs(error.value - prevError.value) > 0.1) {
                        const span = document.createElement("span");
                        span.classList.add("ephemeral"); // should be saved in the snapshot
                        span.style.color = error.value < prevError.value ? "red" : "green";
                        const diff = Math.abs(error.value - prevError.value);
                        const diffSign = diff < 0 ? "+" : "-";
                        const textNode = document.createTextNode(` (${diffSign}${diff.toFixed(2)} ${error.unit})`)
                        span.appendChild(textNode);
                        li.appendChild(span);
                    }
                }
            }

            // total error
            const totalErrors = await api.err.getTotalErr({
                err_type: error.name,
                app_name: elms.data.app.value,
                data_exp_name: elms.data.exp.value,
                model_exp_name: elms.prediction.model.value,
            });

            const totalErrorElm = document.createElement("p");
            totalErrorElm.appendChild(document.createTextNode(
                `
                    Total: ${totalErrors.total_err.toFixed(2)} ${totalErrors.err_unit} 
                    (Train: ${totalErrors.train_err.toFixed(2)} ${totalErrors.err_unit}, 
                    Test: ${totalErrors.test_err.toFixed(2)} ${totalErrors.err_unit})
                `
            ));
            li.appendChild(totalErrorElm);

            errorList.appendChild(li);
        }
        elms.draw.info.appendChild(errorList);
        state.lastErrors = newErrors;
    }



    // add the prediction trace to the new traces
    newTraces.push(predTrace);

    // replace fig with the new one containing the prediction and the old traces
    state.fig = new Fig(elms, canvas, state, newTraces);

    canvas.clear();
    state.fig?.plot();
    nav.enableNavElms();
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    elms.prediction.selectExpModel.addEventListener("click", () => {
        elms.prediction.model.value = elms.data.exp.value;
        updateModelInfo(state, elms);
    })
    elms.prediction.predict.addEventListener("click", () => predict(state, canvas, elms));
}
