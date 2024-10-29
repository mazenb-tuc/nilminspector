import constants from "@/utils/constants";
import { TaskState } from "@/types/tasks";
import * as datetime from "@/utils/datetime";

// backend.api.predict.PredictParams
export interface PredictParams {
    data: datetime.SimpleDateTimeStringStampedData;
    app_name: string;
    gt: datetime.SimpleDateTimeStringStampedData | null;
    model_exp_name: string;
}

// backend.model.PredictionError
export interface PredictionError {
    name: string;
    value: number;
    unit: string;
}

// backend.model.PredictResponse
interface PredictResponse {
    pred: datetime.SimpleDateTimeStringStampedData;
    errors: PredictionError[] | null;
}


export async function getPrediction(params: PredictParams): Promise<PredictResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const respObj = await resp.json();
    respObj.pred = datetime.isoDataToSimple(respObj.pred);
    return respObj as PredictResponse;
}

export type CeleryTaskId = string;
export type AsyncResponse = {
    task_id: CeleryTaskId
}
export async function getAsyncPrediction(params: PredictParams): Promise<AsyncResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/predict/async`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    return resp.json() as unknown as AsyncResponse;
}


type PredProgressMsg = {
    percentage: number,
}
export type PredProgressResponse = {
    state: TaskState
    msg: PredProgressMsg
}
export async function getAsyncPredictionProgress(task_id: CeleryTaskId): Promise<PredProgressResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/predict/async/progress/${task_id}`);
    return resp.json() as unknown as PredProgressResponse;
}

export async function getAsyncPredictionResults(task_id: CeleryTaskId): Promise<PredictResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/predict/async/results/${task_id}`)
    const respObj = await resp.json();
    respObj.pred = datetime.isoDataToSimple(respObj.pred);
    return respObj as PredictResponse;
}
