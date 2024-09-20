import constants from "@/constants";

// backend.api.utils.ResampleRuleToSecondsParams
interface ResampleRuleToSecondsParams {
    rule: string;
}

export async function resampleRuleToSeconds(params: ResampleRuleToSecondsParams): Promise<number> {
    const resp = await fetch(`${constants.backendApiUrl}/utils/resample_rule_to_seconds`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    return (await resp.json()) as number;
}