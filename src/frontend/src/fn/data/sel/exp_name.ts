import State from "@/classes/state"
import Elms from "@/classes/elms"

import * as api from "@/api"
import * as exps from "@/fn/exps"


export async function setExpNamesForDatasetHouseApp(elms: Elms, state: State) {
    const dataset = elms.data.dataset.value
    const house = parseInt(elms.data.house.value)
    const app = elms.data.app.value

    // clear prev options
    elms.data.exp_name.innerHTML = "";

    // add new options
    for (const exp of exps.getExpsForDsHouseApp(state, dataset, house, app).sort()) {
        const option = document.createElement("option");
        option.value = exp.exp_name;
        option.text = exp.exp_name;
        if (exp.type === api.exps.ExpType.ModelExp) {
            const model_exp = exp as api.exps.ParsedModelExp;
            option.text += ` (${model_exp.model_name})`;
        }
        elms.data.exp_name.add(option);
    }

    // select first
    if (elms.data.exp_name.options.length > 0) {
        elms.data.exp_name.value = elms.data.exp_name.options[0].value;
    }

    // since the exp selection is the last to uniquely identify an experiment, we can set the selected experiment here
    await exps.setSelectedExp(elms, state);
}
