import State from "@/classes/state"
import Elms from "@/classes/elms"

export function setAppsForDatasetHouse(elms: Elms, state: State) {
    const dataset = elms.data.dataset.value
    const house = parseInt(elms.data.house.value)

    // clear prev options
    elms.data.app.innerHTML = "";

    // add new options
    for (const exp of state.exps) {
        if (exp.dataset === dataset && exp.house === house) {
            // if app is not already in the list
            if (!Array.from(elms.data.app.options).map(o => o.value).includes(exp.app.toString())) {
                const option = document.createElement("option");
                option.value = exp.app.toString();
                option.text = exp.app.toString();
                elms.data.app.add(option);
            }
        }
    }

    // select first app
    elms.data.app.value = elms.data.app.options[0].value;
}
