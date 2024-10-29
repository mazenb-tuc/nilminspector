import constants from "@/utils/constants";
import * as datetime from "@/utils/datetime";

export type ISOTimeStamp = string;
export interface JSONTimeStampedData {
    [key: ISOTimeStamp]: number;
}

// backend.api.rnd.GetRandomValidDayDateParams
export interface DataStartDurationParams {
    exp_name: string;
    app_name: string;
    only_active: boolean;
}

export interface GetRandomValidDayDateResponse {
    timestamp: datetime.SimpleDateTimeString;
    err: boolean;
    msg: string;
}

export async function getRandomValidDayDate(params: DataStartDurationParams): Promise<GetRandomValidDayDateResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/rnd/valid_day_date`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const respJson = await resp.json() as GetRandomValidDayDateResponse;
    if (!respJson.err) {
        respJson.timestamp = datetime.isoToSimple(respJson.timestamp);
    }
    return respJson;
}
