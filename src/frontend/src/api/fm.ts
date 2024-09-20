import constants from "@/constants";
import * as datetime from "@/utils/datetime";

// backend.api.fm.GetFeatureMapParams
interface GetFeatureMapParams {
    input_data: datetime.SimpleDateStringStampedData;
    model_exp: string;
    transposed: boolean;
}

// backend.api.fm.GetFeatureMapResponse
interface GetFeatureMapResponse {
    activation: Record<string, number[][]>;
    preds: number[];
}

export async function get(params: GetFeatureMapParams): Promise<GetFeatureMapResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/fm`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const data = await resp.json();
    return data as GetFeatureMapResponse;
}
