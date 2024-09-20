import State from "@/classes/state"
import Elms from "@/classes/elms"
import Canvas from "@/classes/canvas"

export function setModelsForDatasetHouseApp(elms: Elms, state: State) {
    // clear previous models' options
    elms.prediction.model.innerHTML = "";

    // for each exp -> model
    for (const exp of state.exps) {
        const option = document.createElement("option");
        option.value = exp.exp_name;
        option.text = `${exp.exp_name} - ${exp.model_name} - ${exp.dataset} - ${exp.house} - ${exp.app}`;
        elms.prediction.model.add(option);
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