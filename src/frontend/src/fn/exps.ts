import State from "@/classes/state"
import Elms from "@/classes/elms"

import objectToHtmlList from "@/utils/objToHtml"


export function updateExpInfo(elms: Elms, state: State) {
    const selectedExp = state.getSelectedExpOrThrow()

    elms.expInfo.innerHTML = `
        <ul>
            <li><details><summary>Dataset: ${selectedExp.dataset}</summary>
                ${objectToHtmlList(state.selectedDsMetadata)}
            </details></li>
            <li><b>House:</b> ${selectedExp.house}</li>
            <li><b>App:</b> ${selectedExp.app}</li>
            <li><b>Experiment:</b> ${selectedExp.exp_name}</li>
            <li><details><summary>Mains Norm Params:</summary>
                <ul>
                    <li><b>Mean:</b> ${selectedExp.mains_norm_params[0].toFixed(2)}</li>
                    <li><b>Std:</b> ${selectedExp.mains_norm_params[1].toFixed(2)}</li>
                </ul>
            </details></li>
            <li><details><summary>App Norm Params:</summary>
                <ul>
                    <li><b>Mean:</b> ${selectedExp.app_norm_params[0].toFixed(2)}</li>
                    <li><b>Std:</b> ${selectedExp.app_norm_params[1].toFixed(2)}</li>
                </ul>
            </details></li>
            <li><b>Selected Model Weights:</b> ${selectedExp.selected_model_weights}</li>
            <li><b>Sequence Length:</b> ${selectedExp.sequence_length}</li>
            <li><details><summary>Selected AC Type:</summary>
                <ul>
                    <li><b>Mains:</b> ${selectedExp.selected_ac_type.mains}</li>
                    <li><b>Apps:</b> ${selectedExp.selected_ac_type.apps}</li>
                </ul>
            </details></li>
            <li><details><summary>Resample Params:</summary>
                <ul>
                    <li><b>Rule:</b> ${selectedExp.resample_params.rule}</li>
                    <li><b>How:</b> ${selectedExp.resample_params.how}</li>
                    <li><b>Fill:</b> ${selectedExp.resample_params.fill}</li>
                </ul>
            </details></li>
            <li><b>Train Percent:</b> ${selectedExp.selected_train_percent * 100}%</li>
            <li><b>Batch Size:</b> ${selectedExp.batch_size}</li>
            <li><b>Num Epochs:</b> ${selectedExp.num_epochs}</li>
            <li><b>Model Name:</b> ${selectedExp.model_name}</li>
            <li><b>Description:</b> ${selectedExp.description}</li>
            <li><b>On Power Threshold:</b> ${selectedExp.on_power_threshold}</li>
            <li><b>Model Class:</b><pre>${selectedExp.model_class}</pre></li>
            <li><b>Dataset Class:</b><pre>${selectedExp.ds_class}</pre></li>
            <li><details><summary>Train/Test Dates:</summary>
                <ul>
                    <li><b>Train Start:</b> ${selectedExp.train_start}</li>
                    <li><b>Train End:</b> ${selectedExp.train_end}</li>
                    <li><b>Test Start:</b> ${selectedExp.test_start}</li>
                    <li><b>Test End:</b> ${selectedExp.test_end}</li>
                </ul>
            </details></li>
        </ul>
    `
}

export async function setSelectedExp(elms: Elms, state: State) {
    const expName = elms.data.exp.value

    const selectedExp = state.exps.find(d => d.exp_name === expName)
    if (selectedExp === undefined) {
        alert("selectedExp is undefined")
        return;
    }
    elms.data.exp.value = selectedExp.exp_name;
    await state.setSelectedExp(selectedExp);
}

export async function setExpsForDatasetHouseApp(elms: Elms, state: State) {
    const dataset = elms.data.dataset.value
    const house = parseInt(elms.data.house.value)
    const app = elms.data.app.value

    // clear prev options
    elms.data.exp.innerHTML = "";

    // add new options
    for (const exp of state.exps) {
        if (exp.dataset === dataset && exp.house === house && exp.app === app) {
            const option = document.createElement("option");
            option.value = exp.exp_name;
            option.text = `${exp.exp_name} - ${exp.description}`
            elms.data.exp.add(option);
        }
    }

    // select first
    elms.data.exp.value = elms.data.exp.options[0].value;

    // set model to exp
    elms.prediction.model.value = elms.data.exp.value;

    // since the app selection is the last to uniquely identify an experiment, we can set the selected experiment here
    await setSelectedExp(elms, state)
    updateExpInfo(elms, state)
}