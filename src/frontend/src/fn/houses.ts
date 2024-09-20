import State from "@/classes/state"
import Elms from "@/classes/elms"

export function setHousesForDataset(elms: Elms, state: State) {
    const dataset = elms.data.dataset.value
    const unique_houses = state.exps
        .filter(d => d.dataset === dataset)
        .map(d => d.house)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => a - b);

    // clear prev options
    elms.data.house.innerHTML = "";

    // add new options
    for (const house of unique_houses) {
        const option = document.createElement("option");
        option.value = house.toString();
        option.text = house.toString();
        elms.data.house.add(option);
    }

    // select first house
    elms.data.house.value = unique_houses[0].toString();
}