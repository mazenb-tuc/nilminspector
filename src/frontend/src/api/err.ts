import constants from "@/utils/constants";
import * as datetime from "@/utils/datetime";

export async function getErrTypes(): Promise<string[]> {
    const resp = await fetch(`${constants.backendApiUrl}/err/types`);
    const respObj = await resp.json();
    return respObj as string[];
}

export type ErrHigherBetter = { [key: string]: boolean }; // key is err type

export async function getHigherBetter(): Promise<ErrHigherBetter> {
    const resp = await fetch(`${constants.backendApiUrl}/err/higher_better`);
    const respObj = await resp.json();
    return respObj as ErrHigherBetter;
}

// backend.api.err.ErrHistParams
export interface ErrHistParams {
    data_exp_name: string;
    app_name: string;
    err_type: string;
    bins: number;
}

// backend.api.err.ErrHistResponse
export interface ErrHistResponse {
    hist: number[];
    bin_edges: number[];
    unit: string;
}

export async function getErrHist(params: ErrHistParams): Promise<ErrHistResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/err/hist`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const respObj = await resp.json();
    return respObj as ErrHistResponse;
}

// backend.api.err.RndDateWithErrParams
export interface RndDateWithErrParams {
    exp_name: string;
    app_name: string;
    err_type: string;
    err_min: number;
    err_max: number;
    duration_samples: number;
}

// backend.api.err.RndDateWithErrResponse
export interface RndDateWithErrResponse {
    err: boolean;
    err_msg: string;
    start_date: datetime.SimpleDateTimeString;
    end_date: datetime.SimpleDateTimeString;
    duration_samples: number;
}

export async function getRndDateWithErr(params: RndDateWithErrParams): Promise<RndDateWithErrResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/err/rnd_date_with_err`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const respObj = await resp.json() as RndDateWithErrResponse;
    respObj.start_date = datetime.isoToSimple(respObj.start_date);
    respObj.end_date = datetime.isoToSimple(respObj.end_date);
    return respObj as RndDateWithErrResponse;
}

// backend.api.err.TotalErrParams
export interface TotalErrParams {
    err_type: string;
    data_exp_name: string;
    app_name: string;
    model_exp_name: string;
}

// backend.api.err.TotalErrResponse
export interface TotalErrResponse {
    train_err: number;
    test_err: number;
    total_err: number;
    err_unit: string;
}

export async function getTotalErr(params: TotalErrParams): Promise<TotalErrResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/err/total_err`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const respObj = await resp.json();
    return respObj as TotalErrResponse;
}
