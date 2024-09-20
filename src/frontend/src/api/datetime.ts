import constants from "@/constants";
import * as datetime from "@/utils/datetime";

// backend.api.data.DatetimeRangeParams
export interface DatetimeRangeParams {
    exp_name: string;
}

// backend.api.data.DatetimeRange
export interface DatetimeRange {
    start: datetime.SimpleDateString;
    end: datetime.SimpleDateString;
}

export async function getDatetimeRange(params: DatetimeRangeParams): Promise<DatetimeRange> {
    const resp = await fetch(`${constants.backendApiUrl}/data/datetime_range`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),

    });
    const respObj = await resp.json();
    return {
        start: datetime.isoDateStringToSimpleDateString(respObj.start),
        end: datetime.isoDateStringToSimpleDateString(respObj.end),
    } as DatetimeRange;
}
