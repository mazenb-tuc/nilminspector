import constants from "@/constants";
import * as datetime from "@/utils/datetime";

export type ISOTimeStamp = string;
export interface JSONTimeStampedData {
    [key: ISOTimeStamp]: number;
}

// backend.api.data.DataStartDurationParams
export interface DataStartDurationParams {
    data_exp_name: string;
    app_name: string;
    start: datetime.SimpleDateString;
    duration: string;
}

export async function getDataStartDuration(params: DataStartDurationParams): Promise<datetime.SimpleDateStringStampedData> {
    const resp = await fetch(`${constants.backendApiUrl}/data/start_duration`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const data: JSONTimeStampedData = await resp.json()
    const stampedData: datetime.SimpleDateStringStampedData = {};
    for (const [key, value] of Object.entries(data)) {
        stampedData[datetime.isoDateStringToSimpleDateString(key)] = value;
    }
    return stampedData;
}