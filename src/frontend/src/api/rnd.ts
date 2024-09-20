import constants from "@/constants";
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

export async function getRandomValidDayDate(params: DataStartDurationParams): Promise<datetime.SimpleDateString> {
    const resp = await fetch(`${constants.backendApiUrl}/rnd/valid_day_date`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const date: datetime.ISOTimeStamp = await resp.json()
    return datetime.isoDateStringToSimpleDateString(date);
}