import constants from "@/constants";
import * as datetime from "@/utils/datetime";

// backend.api.predict.PredictParams
interface PredictParams {
    data: datetime.SimpleDateStringStampedData;
    app_name: string;
    gt: datetime.SimpleDateStringStampedData | null;
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
    pred: datetime.SimpleDateStringStampedData;
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
    respObj.pred = datetime.isoTimeStampedDataToSimpleDateStringStampedData(respObj.pred);
    return respObj as PredictResponse;
}
