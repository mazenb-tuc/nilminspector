import constants from "@/utils/constants";
import * as datetime from "@/utils/datetime";

export async function getValidYears(exp_name: string): Promise<number[]> {
    const url_with_params = `${constants.backendApiUrl}/overview/valid_years?` + new URLSearchParams(
        {
            exp_name
        }
    ).toString();
    const resp = await fetch(url_with_params, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const respObj = await resp.json();
    return respObj;
}

// api.overview.DailyMeanResponse
interface DailyMeanResponse {
    mains: datetime.SimpleDateTimeStringStampedData;
    app: datetime.SimpleDateTimeStringStampedData;
}



export async function getDailyMean(exp_name: string): Promise<DailyMeanResponse> {
    const url_with_params = `${constants.backendApiUrl}/overview/daily_mean?` + new URLSearchParams(
        {
            exp_name
        }
    ).toString();
    const resp = await fetch(url_with_params, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const respObj = await resp.json();
    return {
        mains: datetime.isoDataToSimple(respObj.mains),
        app: datetime.isoDataToSimple(respObj.app),
    } as DailyMeanResponse;
}