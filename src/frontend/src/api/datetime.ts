import constants from "@/utils/constants";
import * as datetime from "@/utils/datetime";

// backend.api.data.DatetimeRangeParams
export interface DatetimeRangeParams {
    dataset: string;
    house: number;
    app: string;
}

// backend.api.data.DatetimeRange
export interface DatetimeRange {
    start: datetime.SimpleDateTimeString;
    end: datetime.SimpleDateTimeString;
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
        start: datetime.isoToSimple(respObj.start),
        end: datetime.isoToSimple(respObj.end),
    } as DatetimeRange;
}
