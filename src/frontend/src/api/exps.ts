import constants from "@/constants";
import * as datetime from "@/utils/datetime";

interface ACType {
    mains: string;
    apps: string;
}

interface ResampleParams {
    rule: string;
    how: string;
    fill: string;
}

// backend.api.exps.ParsedExp
export interface ParsedExp {
    dataset: string;
    house: number;
    app: string;
    exp_name: string;
    app_norm_params: Record<string, number>;
    mains_norm_params: Record<string, number>;
    selected_model_weights: string;
    sequence_length: number;
    selected_ac_type: ACType;
    resample_params: ResampleParams;
    selected_train_percent: number;
    batch_size: number;
    num_epochs: number;
    model_name: string;
    description: string;
    on_power_threshold: number;
    model_class: string;
    ds_class: string;

    train_start: datetime.SimpleDateString;
    train_end: datetime.SimpleDateString;
    test_start: datetime.SimpleDateString;
    test_end: datetime.SimpleDateString;
}

export async function getAll(): Promise<ParsedExp[]> {
    const resp = await fetch(`${constants.backendApiUrl}/exps/all`);
    const respObj = await resp.json();
    for (let i = 0; i < respObj.length; i++) {
        respObj[i].train_start = datetime.isoDateStringToSimpleDateString(respObj[i].train_start);
        respObj[i].train_end = datetime.isoDateStringToSimpleDateString(respObj[i].train_end);
        respObj[i].test_start = datetime.isoDateStringToSimpleDateString(respObj[i].test_start);
        respObj[i].test_end = datetime.isoDateStringToSimpleDateString(respObj[i].test_end);
    }
    return respObj as ParsedExp[];
}
