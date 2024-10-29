import State from "@/classes/state"
import Elms from "@/classes/elms"
import Canvas from "@/classes/canvas"

import * as api from "@/api"

export function setModelsForDatasetHouseApp(elms: Elms, state: State) {
    // clear previous models' options
    elms.prediction.model.innerHTML = "";

    // for each exp -> model
    for (const exp of state.exps) {
        // exp with a model
        if (exp.type !== api.exps.ExpType.ModelExp) continue;
        const model_exp = exp as api.exps.ParsedModelExp;

        // same appliance
        if (model_exp.app.toLocaleLowerCase() !== elms.data.app.value.toLocaleLowerCase()) continue;

        const option = document.createElement("option");
        option.value = model_exp.exp_name;
        option.text = `${model_exp.exp_name} - ${model_exp.model_name} - ${model_exp.dataset} - ${model_exp.house} - ${model_exp.app}`;
        elms.prediction.model.add(option);
    }

    // if no models found
    if (elms.prediction.model.length === 0) {
        // add dummy option
        const option = document.createElement("option");
        option.value = "";
        option.text = "No models found for selection";
        elms.prediction.model.add(option);

        // disable model selection button
        elms.prediction.selectExpModel.classList.add("navExclude");
        elms.prediction.selectExpModel.disabled = true;

        // disable prediction button
        elms.prediction.predict.classList.add("navExclude");
        elms.prediction.predict.disabled = true;
    } else {
        // enable nav to control the buttons
        elms.prediction.selectExpModel.classList.remove("navExclude");
        elms.prediction.predict.classList.remove("navExclude");
    }

    // sort options by name
    const options = Array.from(elms.prediction.model.options);
    options.sort((a, b) => a.text.localeCompare(b.text));
    elms.prediction.model.innerHTML = "";
    for (const option of options) {
        elms.prediction.model.add(option);
    }

    // select the first model
    elms.prediction.model.selectedIndex = 0;
}

export function updateModelInfo(state: State, elms: Elms) {
    // get exp of the model
    const modelExpName = elms.prediction.model.value;
    const modelExp = state.exps.find(d => d.exp_name === modelExpName);

    // update model info
    elms.prediction.modelInfo.innerHTML = `
        <details>
            <summary>Model Info</summary>
            Model: ${modelExp?.model_name}<br/>
            Exp: ${modelExp?.exp_name}<br/>
            Description: ${modelExp?.description}<br/>
            Trained on:
            <ul>
                <li>Dataset ${modelExp?.dataset}</li>
                <li>House ${modelExp?.house}</li>
                <li>App: ${modelExp?.app}</li>
            </ul>
        </details>
    `
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    updateModelInfo(state, elms);

    elms.prediction.model.addEventListener("change", async () => {
        updateModelInfo(state, elms);
    });
}