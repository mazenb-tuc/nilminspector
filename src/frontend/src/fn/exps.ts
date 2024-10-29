import State from "@/classes/state"
import Elms from "@/classes/elms"

import * as api from "@/api";
import * as exps from "@/fn/exps";
import objectToHtmlList from "@/utils/objToHtml"
import CustomEventNames from "@/utils/events";

function updateExpInfo(elms: Elms, state: State) {
    const selectedExp = state.getSelectedExpOrThrow()

    // list items for ModelExp
    let modelExpItems: string | undefined = undefined;
    if (selectedExp.type === api.exps.ExpType.ModelExp) {
        const modelExp = selectedExp as api.exps.ParsedModelExp;
        modelExpItems = `
        <li><b>Selected Model Weights:</b> ${modelExp.selected_model_weights}</li>
            <li><b>Sequence Length:</b> ${modelExp.sequence_length}</li>
            <li><b>Train Percent:</b> ${modelExp.selected_train_percent * 100}%</li>
            <li><b>Batch Size:</b> ${modelExp.batch_size}</li>
            <li><b>Num Epochs:</b> ${modelExp.num_epochs}</li>
            <li><b>Model Name:</b> ${modelExp.model_name}</li>
            <li><b>On Power Threshold:</b> ${modelExp.on_power_threshold}</li>
            <li><details><summary>Classes:</summary>
                <ul>
                    <li><b>Model:</b><pre>${modelExp.model_class}</pre></li>
                    <li><b>Dataset:</b><pre>${modelExp.ds_class}</pre></li>
                </ul>
            </details></li>
            <li><details><summary>Train/Test Dates:</summary>
                <ul>
                    <li><b>Train Start:</b> ${modelExp.train_start}</li>
                    <li><b>Train End:</b> ${modelExp.train_end}</li>
                    <li><b>Test Start:</b> ${modelExp.test_start}</li>
                    <li><b>Test End:</b> ${modelExp.test_end}</li>
                </ul>
            </details></li>
            `
    }

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
            <li><b>Description:</b> ${selectedExp.description}</li>
            ${modelExpItems === undefined ? "" : modelExpItems}
        </ul>
    `
}

export function getExpsForDsHouseApp(state: State, dataset: string, house: number, app: string, ignore_case: boolean = true): api.exps.ParsedExp[] {
    if (ignore_case) {
        dataset = dataset.toLowerCase();
        app = app.toLowerCase();
    }

    const result = [];
    for (const exp of state.exps) {
        let exp_dataset = exp.dataset;
        let exp_app = exp.app;
        if (ignore_case) {
            exp_dataset = exp_dataset.toLowerCase();
            exp_app = exp_app.toLowerCase();
        }
        if (exp_dataset === dataset && exp.house === house && exp_app === app) {
            result.push(exp);
        }
    }

    return result;
}

export async function setSelectedExp(elms: Elms, state: State) {
    const selectedDataset = elms.data.dataset.value;
    const selectedHouse = parseInt(elms.data.house.value);
    const selectedApp = elms.data.app.value;
    const selectedExpName = elms.data.exp_name.value;

    // find matching exp
    let matchingExps: api.exps.ParsedExp[] = [];
    for (const exp of exps.getExpsForDsHouseApp(state, selectedDataset, selectedHouse, selectedApp)) {
        // found a match!
        if (exp.exp_name === selectedExpName)
            matchingExps.push(exp);
    }

    // no match found
    if (matchingExps.length === 0) {
        alert(`
            No matching exp found for the selected:
                dataset ${selectedDataset}
                house ${selectedHouse}
                app ${selectedApp}
        `);
        return;
    }

    // more than one match!
    if (matchingExps.length > 1) {
        alert(`
            More than one matching exp found for the selected:
                dataset ${selectedDataset}
                house ${selectedHouse}
                app ${selectedApp}
                exp name ${selectedExpName}
            Please check the exps data for duplicates.
        `);
        return;
    }

    const selectedExp = matchingExps[0];
    await state.setSelectedExp(selectedExp);
    updateExpInfo(elms, state);
    window.dispatchEvent(new CustomEvent(
        CustomEventNames.NEW_EXP_SELECTED,
        { detail: selectedExp },
    ));
}
