import constants from "@/utils/constants";
import * as datetime from "@/utils/datetime";



// backend.api.data.DataStartDurationParams
export interface DataStartDurationParams {
    data_exp_name: string;
    app_name: string;
    start: datetime.SimpleDateTimeString;
    duration: string;
}

export async function getDataStartDuration(params: DataStartDurationParams): Promise<datetime.SimpleDateTimeStringStampedData> {
    const resp = await fetch(`${constants.backendApiUrl}/data/start_duration`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    return datetime.isoDataToSimple(await resp.json());
}

// backend.api.data.DataStartEndParams
export interface DataStartEndParams {
    exp_name: string;
    app_name: string;
    start: datetime.SimpleDateTimeString;
    end: datetime.SimpleDateTimeString;
}

export async function getDataStartEnd(params: DataStartEndParams): Promise<datetime.SimpleDateTimeStringStampedData> {
    const resp = await fetch(`${constants.backendApiUrl}/data/start_end`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    return datetime.isoDataToSimple(await resp.json());
}

export async function getDatasets(): Promise<string[]> {
    const resp = await fetch(`${constants.backendApiUrl}/data/datasets`);
    return await resp.json();
}

export async function getHouses(dataset: string): Promise<number[]> {
    const url_with_params = `${constants.backendApiUrl}/data/houses?` + new URLSearchParams(
        {
            dataset
        }
    ).toString();
    const resp = await fetch(url_with_params);
    return await resp.json();
}

export async function getApps(dataset: string, house: number): Promise<string[]> {
    const url_with_params = `${constants.backendApiUrl}/data/apps?` + new URLSearchParams(
        {
            dataset,
            house: house.toString(),
        }
    ).toString();
    const resp = await fetch(url_with_params);
    return await resp.json();
}
