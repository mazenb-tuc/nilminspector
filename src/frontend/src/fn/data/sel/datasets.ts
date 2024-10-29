import Elms from "@/classes/elms"

import * as api from "@/api"

export async function setDatasets(elms: Elms) {
    const datasets = await api.data.getDatasets();

    for (const dataset of datasets.sort()) {
        const option = document.createElement("option");
        option.value = dataset;
        option.text = dataset;
        elms.data.dataset.add(option);
    }
}