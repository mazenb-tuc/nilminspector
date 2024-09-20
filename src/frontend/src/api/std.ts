import constants from "@/constants";

// backend.api.std.StdWattsParams
export interface StdWattsParams {
    std_threshold: number;
    data_exp_name: string;
    app_name: string;
}

// backend.api.std.StdWattsResponse
export interface StdWattsResponse {
    lower: number;
    upper: number;
    mean: number;
    std: number;
}

export async function getStdWatts(params: StdWattsParams): Promise<StdWattsResponse> {
    const resp = await fetch(`${constants.backendApiUrl}/std/watts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    return (await resp.json()) as StdWattsResponse;
}
