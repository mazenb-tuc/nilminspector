import * as api from "@/api";

export type PredictionErrorsObj = { [key: string]: api.predict.PredictionError };

export interface Snapshot {
    name: string;
    desc: string;
    pred_error: PredictionErrorsObj;
    img: HTMLImageElement;
    legend: HTMLElement;
    info: HTMLElement;
    fm: HTMLElement;
    fm_imgs_dataurl: string[];
}
