import constants from "@/constants";
import * as datetime from "@/utils/datetime";

export async function getErrTypes(): Promise<string[]> {
    const resp = await fetch(`${constants.backendApiUrl}/err/types`);
    const respObj = await resp.json();
    return respObj as string[];
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

// backend.api.err.RndDataWithErrParams
export interface RndDataWithErrParams {
    data_exp_name: string;
    app_name: string;
    err_type: string;
    err_min: number;
    err_max: number;
    duration_samples: number;
}

// backend.api.err.RndDataWithErrResponse
export interface RndDataWithErrResponse {
    data: datetime.SimpleDateStringStampedData;
    err: boolean;
    err_msg: string;
}

export async function getRndDataWithErr(params: RndDataWithErrParams): Promise<RndDataWithErrResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/err/rnd_data_with_err`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const respObj = await resp.json();
    respObj.data = datetime.isoTimeStampedDataToSimpleDateStringStampedData(respObj.data);
    return respObj as RndDataWithErrResponse;
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
