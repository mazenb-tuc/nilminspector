import constants from "@/utils/constants";

// backend.api.ds_info.GetDsMetadataParams
export interface GetDsMetadataParams {
    ds: string;
}
export async function getDsMetadata(params: GetDsMetadataParams): Promise<object> {
    const resp = await fetch(`${constants.backendApiUrl}/ds_info/metadata`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),

    });
    return await resp.json();
}
