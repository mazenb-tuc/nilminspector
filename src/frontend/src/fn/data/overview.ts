import * as echarts from 'echarts';

import State from "@/classes/state";
import Elms from "@/classes/elms";
import Canvas from "@/classes/canvas";

import * as api from "@/api";
import * as datetime from "@/utils/datetime";
import CustomEventNames from "@/utils/events";

async function updateYearsSelector(elms: Elms) {
    const yearSelector = elms.data.overview.dailyActivity.yearSelector;
    yearSelector.disabled = true;

    const exp_name = elms.data.exp_name.value;

    // get valid years for the selected experiment
    const valid_years = await api.overview.getValidYears(exp_name);

    // update the year selector options
    yearSelector.innerHTML = "";
    valid_years.forEach((year) => {
        const option = document.createElement("option");
        option.value = year.toString();
        option.text = year.toString();
        yearSelector.add(option);
    })

    // select the first year by default
    yearSelector.value = valid_years[0].toString();

    yearSelector.disabled = false;
}

async function goToDate(date: datetime.SimpleDateString) {
    alert(`TODO: go to this date: ${date}`);

    // WIP (from ./err.ts)
    // const commonGetDataStartEndParams = {
    //     start: rndErrDateWithErrResponse.start_date,
    //     end: rndErrDateWithErrResponse.end_date,
    //     data_exp_name: elms.data.exp.value,
    // }

    // const traces: Trace[] = [];

    // // mains
    // {
    //     const data = await api.data.getDataStartEnd({ app_name: "mains", ...commonGetDataStartEndParams });
    //     const trace = new Trace(0, "mains", data, colors.getMatplotlibColor(0));
    //     traces.push(trace);
    // }

    // // app
    // {
    //     const data = await api.data.getDataStartEnd({ app_name, ...commonGetDataStartEndParams });
    //     const trace = new Trace(0, app_name, data, colors.getMatplotlibColor(1));
    //     traces.push(trace);
    // }

    // await state.setOriginalTraces(traces);
    // nav.enableNavElms();
}

function plotDailyActivity(
    dailyMeans: datetime.SimpleDateTimeStringStampedData,
    selectedYear: string,
    container: HTMLDivElement,
) {
    const roundedDailyMeans = Object.fromEntries(
        Object.entries(dailyMeans).map(([date, mean]) => [date, Math.round(mean)])
    );

    // for the min/max legend (visualMap)
    const means = Object.values(dailyMeans);
    const roundedMeans = means.map((mean) => Math.round(mean));
    const meansMin = Math.min(...roundedMeans);
    const meansMax = Math.max(...roundedMeans);

    // for the series->data
    const formattedDailyMeans: [datetime.SimpleDateString, number][] = [];
    for (const [date, value] of Object.entries(roundedDailyMeans)) {
        formattedDailyMeans.push([datetime.getDateFromSimpleDateTimeString(date), value]);
    }

    const option = {
        title: {
            top: 0,
            left: 'center',
            text: `Daily Activity for ${selectedYear}`
        },
        tooltip: {
            show: true,
            formatter: "{c}",
        },
        visualMap: {
            min: meansMin,
            max: meansMax,
            type: 'piecewise',
            orient: 'horizontal',
            left: 'center',
            top: 30
        },
        calendar: {
            top: 70,
            left: 30,
            right: 30,
            cellSize: ['auto', 13],
            range: selectedYear,
            itemStyle: {
                borderWidth: 0.5
            },
            yearLabel: { show: true }
        },
        series: {
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: formattedDailyMeans // expected format: [['2016-01-01', 100], ['2016-01-02', 200], ...]
        }
    };

    // set the container size
    container.style.width = '600px';
    container.style.height = '180px';

    // render the chart
    const chart = echarts.init(container);
    chart.setOption(option);

    // change to day on click
    chart.on('click', (params: echarts.ECElementEvent) => {
        (async () => {
            let clickedDate: datetime.SimpleDateString;
            if (Array.isArray(params.data) && params.data[0]) {
                clickedDate = params.data[0] as datetime.SimpleDateString;
            } else {
                alert("No data found for the clicked date.");
                return;
            }

            await goToDate(clickedDate);
        })();
    });
}

async function updateDailyActivityPlots(elms: Elms) {
    // https://echarts.apache.org/examples/en/editor.html?c=calendar-heatmap

    // get daily means
    const selectedYear = elms.data.overview.dailyActivity.yearSelector.value;
    const dailyMeans = await api.overview.getDailyMean(elms.data.exp_name.value);

    // plot the daily activity for mains and app
    plotDailyActivity(dailyMeans.mains, selectedYear, elms.data.overview.dailyActivity.plotContainer.mains);
    plotDailyActivity(dailyMeans.app, selectedYear, elms.data.overview.dailyActivity.plotContainer.app);
}

export async function setupListeners(state: State, canvas: Canvas, elms: Elms) {
    await updateYearsSelector(elms);

    // when exp or app change, update valid years and the year selector options
    const handler = async () => {
        await updateYearsSelector(elms);
        await updateDailyActivityPlots(elms);
    }
    window.addEventListener(CustomEventNames.NEW_EXP_SELECTED, handler);
    window.addEventListener(CustomEventNames.NEW_APP_SELECTED, handler);

    // watch for year change and update the plot
    await updateDailyActivityPlots(elms);
    elms.data.overview.dailyActivity.yearSelector.addEventListener(
        "change",
        async () => {
            await updateDailyActivityPlots(elms);
        }
    );
}
