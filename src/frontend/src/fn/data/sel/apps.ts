import State from "@/classes/state"
import Elms from "@/classes/elms"

import * as api from "@/api"

export async function setAppsForDatasetHouse(elms: Elms, state: State) {
    const dataset = elms.data.dataset.value
    const house = parseInt(elms.data.house.value)
    const apps = await api.data.getApps(dataset, house)

    // clear prev options
    elms.data.app.innerHTML = "";

    // add new options
    for (const app of apps.sort()) {
        const option = document.createElement("option");
        option.value = app.toString();
        option.text = app.toString();
        elms.data.app.add(option);
    }

    // select first app
    elms.data.app.value = elms.data.app.options[0].value;
}
