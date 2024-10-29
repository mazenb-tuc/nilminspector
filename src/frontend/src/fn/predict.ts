import State from "@/classes/state";
import Canvas from "@/classes/canvas";
import Elms from "@/classes/elms";
import Fig from "@/classes/fig";
import Trace from "@/classes/trace";

import * as api from "@/api";
import * as colors from "@/utils/colors";
import * as nav from "@/utils/nav";
import { updateModelInfo } from "./models";
import { TaskState } from "@/types/tasks";

export async function predict(state: State, canvas: Canvas, elms: Elms) {
    nav.disableNavElms()

    // check if mains data is loaded
    const mainsTrace = state.fig?.getTraceByName("mains");
    if (mainsTrace === undefined) return;
    if (mainsTrace?.data === undefined) return;

    // check that the data is long enough (i.e. > seq length)
    const selectedModelExpName = elms.prediction.model.value;
    if (selectedModelExpName === "") {
        alert("Select a model to predict with");
        nav.enableNavElms();
        return;
    }
    const selectedExp = state.exps.find((exp) => exp.exp_name === selectedModelExpName);
    if (selectedExp === undefined) {
        alert("Selected experiment not found");
        nav.enableNavElms();
        return;
    }

    // must be a modelexp
    if (selectedExp.type !== api.exps.ExpType.ModelExp) {
        alert("Selected experiment is not a model experiment (i.e. does not have a trained model)");
        nav.enableNavElms();
        return;
    }
    const selectedModelExp = selectedExp as api.exps.ParsedModelExp;

    if (Object.keys(mainsTrace?.data).length < selectedModelExp.sequence_length) {
        alert(`Data is too short for prediction (need at least ${selectedModelExp.sequence_length} points)`);
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
    const pred_params: api.predict.PredictParams = {
        data: mainsTrace?.data,
        app_name: gtTrace?.name,
        gt: gtTrace?.data,
        model_exp_name: elms.prediction.model.value,
    }
    // const predictionResponse = await api.predict.getPrediction(pred_params);
    const pred_async_resp: api.predict.AsyncResponse = await api.predict.getAsyncPrediction(pred_params);
    while (true) {
        await new Promise(r => setTimeout(r, 100));
        const pred_status: api.predict.PredProgressResponse = await api.predict.getAsyncPredictionProgress(pred_async_resp.task_id);
        elms.pbar.title.textContent = "Predicting...";
        elms.pbar.bar.style.display = 'block';
        elms.pbar.bar.value = pred_status.msg.percentage;

        if (pred_status.state === TaskState.SUCCESS)
            break;
        if (pred_status.state === TaskState.FAILED)
            break;
    }
    elms.pbar.bar.style.display = 'none';
    elms.pbar.title.textContent = "";

    const predictionResponse = await api.predict.getAsyncPredictionResults(pred_async_resp.task_id);
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
                // show change to previous error if exists and abs difference is bigger than 0.01
                const prevError = state.lastErrors[error.name];
                if (Math.abs(error.value - prevError.value) > 0.01) {
                    const span = document.createElement("span");
                    span.classList.add("ephemeral"); // should be saved in the snapshot

                    if (!state.errHigherBetter.hasOwnProperty(error.name)) {
                        alert(`Error type ${error.name} not found in state.errHigherBetter`)
                    }

                    if (state.errHigherBetter[error.name]) {
                        span.style.color = error.value > prevError.value ? "green" : "red";
                    } else {
                        span.style.color = error.value > prevError.value ? "red" : "green";
                    }

                    const diff = Math.abs(error.value - prevError.value);
                    const diffSign = error.value - prevError.value > 0 ? "+" : "-";
                    const diffTxt = `${diffSign}${diff.toFixed(2)} ${error.unit}`

                    const diffPercent = Math.abs(diff / prevError.value) * 100;
                    const diffPercentTxt = `${diffSign}${diffPercent.toFixed(2)}%`

                    const textNode = document.createTextNode(` (${diffTxt} ~ ${diffPercentTxt})`)
                    span.appendChild(textNode);
                    li.appendChild(span);
                }
            }

            // total error
            const totalErrors = await api.err.getTotalErr({
                err_type: error.name,
                app_name: elms.data.app.value,
                data_exp_name: elms.data.exp_name.value,
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
        elms.prediction.model.value = elms.data.exp_name.value;
        updateModelInfo(state, elms);
    })
    elms.prediction.predict.addEventListener("click", () => predict(state, canvas, elms));
}
