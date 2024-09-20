// backend.api.day_info

import constants from "@/constants";
import * as datetime from "@/utils/datetime";


interface DayInfoParams {
    ts: datetime.ISOTimeStamp;
    exp_name: string;
}


export interface DayInfoResponse {
    holiday: boolean;
    holiday_name?: string;
    day_name: string;
    weekend: boolean;
    sunrise: datetime.SimpleDateString;
    sunset: datetime.SimpleDateString;
}

export async function get(params: DayInfoParams): Promise<DayInfoResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/day_info`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const data = await resp.json();
    data.sunrise = datetime.isoDateStringToSimpleDateString(data.sunrise);
    data.sunset = datetime.isoDateStringToSimpleDateString(data.sunset);
    return data as DayInfoResponse;
}
