import State from "@/classes/state"
import Elms from "@/classes/elms"

import * as api from "@/api"

export async function setHousesForDataset(elms: Elms, state: State) {
    const dataset = elms.data.dataset.value
    const houses = await api.data.getHouses(dataset)

    // clear prev options
    elms.data.house.innerHTML = "";

    // add new options
    for (const house of houses.sort()) {
        const option = document.createElement("option");
        option.value = house.toString();
        option.text = house.toString();
        elms.data.house.add(option);
    }

    // select first house
    elms.data.house.value = houses[0].toString();
}