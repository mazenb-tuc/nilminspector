import constants from "@/utils/constants";
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

// enum for possible values of the parsed exp types: Exp, ModelExp
// see classes of exp in backend.exps
export enum ExpType {
    Exp = "Exp",
    ModelExp = "ModelExp",
}

// backend.api.exps.*
export interface ParsedExp {
    // backend.api.exps.ParsedExp
    type: ExpType;

    // backend.exps.Exp
    dataset: string;
    house: number;
    app: string;
    exp_name: string;
    app_norm_params: Record<string, number>;
    mains_norm_params: Record<string, number>;
    selected_ac_type: ACType;
    resample_params: ResampleParams;
    on_power_threshold: number;
    description: string;
}

export interface ParsedModelExp extends ParsedExp {
    // backend.exps.ModelExp
    selected_model_weights: string;
    sequence_length: number;
    selected_train_percent: number;
    batch_size: number;
    num_epochs: number;
    model_name: string;
    model_class: string;
    ds_class: string;

    // backend.api.exps.ParsedModelExp
    // backend.api.exps.WithTrainTestDates
    train_start: datetime.SimpleDateTimeString;
    train_end: datetime.SimpleDateTimeString;
    test_start: datetime.SimpleDateTimeString;
    test_end: datetime.SimpleDateTimeString;
}

export async function getAll(): Promise<ParsedExp[]> {
    const resp = await fetch(`${constants.backendApiUrl}/exps/all`);
    const respObj = await resp.json();
    const result = [];
    for (let i = 0; i < respObj.length; i++) {
        const exp = respObj[i];
        if (exp.type === ExpType.ModelExp) {
            exp.train_start = datetime.isoToSimple(exp.train_start);
            exp.train_end = datetime.isoToSimple(exp.train_end);
            exp.test_start = datetime.isoToSimple(exp.test_start);
            exp.test_end = datetime.isoToSimple(exp.test_end);

            result.push(exp as ParsedModelExp);
        }
        else if (exp.type === ExpType.Exp) {
            result.push(exp as ParsedExp);
        }
        else {
            throw new Error(`Unknown exp type: ${exp.type}`);
        }
    }
    return respObj as ParsedExp[];
}
