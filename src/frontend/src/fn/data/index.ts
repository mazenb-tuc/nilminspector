export * as plot from "./plot"

import Elms from "@/classes/elms"
import State from "@/classes/state"
import Canvas from "@/classes/canvas"
import Trace from "@/classes/trace"

import * as api from "@/api"

import * as colors from "@/utils/colors"
import * as nav from "@/utils/nav"
import * as utils_datetime from "@/utils/datetime";

import * as predict from "@/fn/predict";
import * as houses from "@/fn/houses"
import * as apps from "@/fn/apps"
import * as exps from "@/fn/exps"
import * as models from "@/fn/models"
import * as fn_datetime from "@/fn/datetime"

import * as err from "./err"
import * as plot from "./plot"
import * as pick from "./pick"

const resetMains = (state: State, canvas: Canvas, elms: Elms) => async () => {
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

    const exp_name = elms.data.exp.value;
    const app_name = elms.data.app.value;
    const random_valid_day: utils_datetime.SimpleDateString = await api.rnd.getRandomValidDayDate({
        exp_name,
        app_name,
        only_active: elms.data.randomDataOnlyActive.checked,
    });

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
    for (const dataset of state.getUniqueDatasets()) {
        const option = document.createElement("option");
        option.value = dataset;
        option.text = dataset;
        elms.data.dataset.add(option);
    }
    houses.setHousesForDataset(elms, state)
    apps.setAppsForDatasetHouse(elms, state)
    exps.setExpsForDatasetHouseApp(elms, state)
    models.setModelsForDatasetHouseApp(elms, state)
    await fn_datetime.setDatetimeForSelectedDatasetHouse(elms, state);
    await err.updateErrHist(elms, state);

    // change ds/house
    elms.data.dataset.addEventListener("change", async () => {
        nav.disableNavElms();
        houses.setHousesForDataset(elms, state)
        apps.setAppsForDatasetHouse(elms, state)
        exps.setExpsForDatasetHouseApp(elms, state)
        models.setModelsForDatasetHouseApp(elms, state)
        await fn_datetime.setDatetimeForSelectedDatasetHouse(elms, state)
        await err.updateErrHist(elms, state)
        nav.enableNavElms();
    });
    elms.data.house.addEventListener("change", async () => {
        nav.disableNavElms();
        apps.setAppsForDatasetHouse(elms, state)
        exps.setExpsForDatasetHouseApp(elms, state)
        models.setModelsForDatasetHouseApp(elms, state)
        await fn_datetime.setDatetimeForSelectedDatasetHouse(elms, state)
        await err.updateErrHist(elms, state)
        nav.enableNavElms();
    })
    elms.data.app.addEventListener("change", async () => {
        nav.disableNavElms();
        exps.setExpsForDatasetHouseApp(elms, state)
        models.setModelsForDatasetHouseApp(elms, state)
        await fn_datetime.setDatetimeForSelectedDatasetHouse(elms, state)
        await err.updateErrHist(elms, state)
        nav.enableNavElms();
    })
    elms.data.exp.addEventListener("change", async () => {
        await exps.setSelectedExp(elms, state)
        exps.updateExpInfo(elms, state)
    })

    // get
    elms.data.randomData.addEventListener("click", () => random(state, canvas, elms));
    pick.setupListeners(state, canvas, elms);

    // modify
    elms.data.modify.mains.reset.addEventListener("click", resetMains(state, canvas, elms));

    // err listeners
    err.setupListeners(state, canvas, elms);
}