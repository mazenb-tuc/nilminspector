// backend.api.day_info

import constants from "@/utils/constants";
import * as datetime from "@/utils/datetime";


interface DayInfoParams {
    ts: datetime.ISOTimeStamp;
    exp_name: string;
}


export interface DayInfoResponse {
    err: boolean;
    err_msg?: string;
    holiday?: boolean;
    holiday_name?: string;
    day_name?: string;
    weekend?: boolean;
    sunrise?: datetime.SimpleDateTimeString;
    sunset?: datetime.SimpleDateTimeString;
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
    if (data.err) {
        return data as DayInfoResponse;
    } else {
        data.sunrise = datetime.isoToSimple(data.sunrise);
        data.sunset = datetime.isoToSimple(data.sunset);
        return data as DayInfoResponse;
    }
}
