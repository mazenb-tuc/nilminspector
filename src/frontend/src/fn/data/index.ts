export * as plot from "./plot"

import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"
import Trace from "@/classes/trace"

import * as api from "@/api"

import * as colors from "@/utils/colors"
import * as nav from "@/utils/nav"
import * as utils_datetime from "@/utils/datetime";
import CustomEventNames from "@/utils/events";

import * as predict from "@/fn/predict";
import * as models from "@/fn/models"
import * as exps from "@/fn/exps"

import * as err from "./err"
import * as plot from "./plot"
import * as pick from "./pick"
import * as overview from "./overview"
import * as sel from "./sel"

const resetTraces = (state: State, canvas: Canvas, elms: Elms) => async () => {
    await plot.originalTraces(state, canvas, elms)

    // live prediction?
    if (elms.prediction.live.enabled.checked) {
        predict.predict(state, canvas, elms);
    }
}

export async function random(state: State, canvas: Canvas, elms: Elms) {
    state.reset();
    canvas.setLoading();
    nav.disableNavElms();

    const exp_name = elms.data.exp_name.value;
    const app_name = elms.data.app.value;
    const rnd_valid_date_resp: api.rnd.GetRandomValidDayDateResponse = await api.rnd.getRandomValidDayDate({
        exp_name,
        app_name,
        only_active: elms.data.randomDataOnlyActive.checked,
    });
    if (rnd_valid_date_resp.err) {
        alert(rnd_valid_date_resp.msg);
        nav.enableNavElms();
        return;
    }

    const random_valid_day: utils_datetime.SimpleDateTimeString = rnd_valid_date_resp.timestamp;
    const traces: Trace[] = [];
    const apps = ["mains", app_name]
    for (let i = 0; i < apps.length; i++) {
        const data = await api.data.getDataStartDuration({
            data_exp_name: exp_name,
            app_name: apps[i],
            start: random_valid_day,
            duration: "24h",
        });
        const trace = new Trace(0, apps[i], data, colors.getMatplotlibColor(i));
        traces.push(trace);
    }

    await state.setOriginalTraces(traces);
    await plot.originalTraces(state, canvas, elms);
    await pick.loadCurrentDataDatetime(state, elms);
    nav.enableNavElms();
}

export async function setup(state: State, canvas: Canvas, elms: Elms) {
    // setup datasets options
    await sel.datasets.setDatasets(elms);
    await sel.houses.setHousesForDataset(elms, state)
    await sel.apps.setAppsForDatasetHouse(elms, state)
    await sel.exp_name.setExpNamesForDatasetHouseApp(elms, state)
    models.setModelsForDatasetHouseApp(elms, state)

    // change ds/house
    elms.data.dataset.addEventListener("change", async () => {
        nav.disableNavElms();

        await sel.houses.setHousesForDataset(elms, state)
        await sel.apps.setAppsForDatasetHouse(elms, state)
        await sel.exp_name.setExpNamesForDatasetHouseApp(elms, state)
        models.setModelsForDatasetHouseApp(elms, state)

        nav.enableNavElms();
    });

    elms.data.house.addEventListener("change", async () => {
        nav.disableNavElms();

        await sel.apps.setAppsForDatasetHouse(elms, state)
        await sel.exp_name.setExpNamesForDatasetHouseApp(elms, state)
        models.setModelsForDatasetHouseApp(elms, state)

        nav.enableNavElms();
    })

    elms.data.app.addEventListener("change", async () => {
        window.dispatchEvent(new CustomEvent(
            CustomEventNames.NEW_EXP_SELECTED,
            { detail: elms.data.exp_name.value },
        ));

        nav.disableNavElms();

        await sel.exp_name.setExpNamesForDatasetHouseApp(elms, state)
        models.setModelsForDatasetHouseApp(elms, state)

        nav.enableNavElms();
    })

    elms.data.exp_name.addEventListener("change", async () => {
        nav.disableNavElms();

        models.setModelsForDatasetHouseApp(elms, state)

        // since the exp selection is the last to uniquely identify an experiment, we can set the selected experiment here
        await exps.setSelectedExp(elms, state);

        nav.enableNavElms();
    })

    // get
    elms.data.randomData.addEventListener("click", () => random(state, canvas, elms));
    pick.setupListeners(state, canvas, elms);

    // modify
    elms.data.modify.mains.reset.addEventListener("click", resetTraces(state, canvas, elms));
    elms.data.modify.gt.reset.addEventListener("click", resetTraces(state, canvas, elms));

    // err listeners
    err.setupListeners(state, canvas, elms);

    // overview listeners
    overview.setupListeners(state, canvas, elms);
}