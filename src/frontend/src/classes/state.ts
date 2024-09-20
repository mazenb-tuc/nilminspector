import { PredictionErrorsObj } from "@/types/common";
import { Snapshot } from "@/types/common";

import * as api from "@/api";
import * as datetime from "@/utils/datetime";

import Fig from "./fig";
import Trace from "./trace";
import Elms from "./elms";

interface TraceData {
  idx: number;
  name: string;
  data: string;
  color: string;
}

export default class State {
  elms: Elms;
  exps: api.exps.ParsedExp[] = [];
  selectedDsMetadata: object = {};
  errTypes: string[] = [];
  zerow: boolean = false; // always draw 0 watts line and start from it

  // nullable/undefined attrs
  fig: Fig | null = null
  private _selectedExp: api.exps.ParsedExp | undefined = undefined;
  fullDataDatetimeRange: api.datetime.DatetimeRange | null = null;
  lastErrors: PredictionErrorsObj = {};
  autoPredictTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  snapshots: Snapshot[] = [];
  currErrHistResponse: api.err.ErrHistResponse | null = null;
  stdWatts: api.std.StdWattsResponse | null = null;
  private _originalTracesData: TraceData[] = []; // unmodified traces

  // for zooming
  zooming: boolean = false;
  canvasImgDataBeforeZoom: ImageData | null = null;

  // for prediction
  private _selectedDatetimeRange: api.datetime.DatetimeRange | null = null;
  private _selectedDurationSamples: number | null = null;
  selectedDayInfo: api.day_info.DayInfoResponse | null = null;

  constructor(elms: Elms, fig: Fig | null = null) {
    this.elms = elms;
    this.fig = fig;
  }

  async setup() {
    this.exps = await api.exps.getAll();
    this.errTypes = await api.err.getErrTypes();
  }

  reset() {
    this.fig = null;
  }


  async setSelectedExp(newExp: api.exps.ParsedExp) {
    this._selectedExp = newExp;
    this.selectedDsMetadata = await api.ds_info.getDsMetadata({ ds: newExp.dataset });
  }

  async setSelectedDatetime(
    startDatetime: datetime.SimpleDateString,
    endDatetime: datetime.SimpleDateString,
    durationSamples: number,
  ) {
    if (this._selectedExp === undefined) {
      throw new Error("selectedExp is undefined");
    }

    // udpate section type 

    // train or test?
    // logic: train or test if the same dataset used in the exp)
    const trainEndDate = new Date(this._selectedExp.train_end)
    if (new Date(endDatetime) < trainEndDate) {
      this.elms.data.info.traintest.innerText = "Train Data";
    } else {
      this.elms.data.info.traintest.innerText = "Test Data";
    }

    // day info
    this.selectedDayInfo = await api.day_info.get({
      ts: startDatetime,
      exp_name: this._selectedExp.exp_name,
    });
    this.elms.data.info.dayname.innerText = this.selectedDayInfo.day_name;
    this.elms.data.info.weekend.innerText = this.selectedDayInfo.weekend ? "Weekend" : "Not weekend";

    if (this.selectedDayInfo.holiday) {
      this.elms.data.info.holiday.innerText = `Holiday: ${this.selectedDayInfo.holiday_name}`;
    } else {
      this.elms.data.info.holiday.innerText = "Not a holiday";
    }


    this._selectedDatetimeRange = { start: startDatetime, end: endDatetime };
    this._selectedDurationSamples = durationSamples;
  }

  getUniqueDatasets(): string[] {
    const uniqueDatasets = new Set<string>();
    for (const datasetHouse of this.exps) {
      uniqueDatasets.add(datasetHouse.dataset);
    }
    return Array.from(uniqueDatasets);
  }

  async getSampleDurationInSeconds() {
    // if resample rule is 6s => return 6
    // if resample rule is 1min => return 60
    return await api.utils.resampleRuleToSeconds({
      rule: this.getSelectedExpOrThrow().resample_params.rule
    });
  }

  async setOriginalTraces(traces: Trace[]) {
    // set datetime from new mains data
    const mainsTrace: Trace = traces.filter(trace => trace.name === 'mains')[0];
    if (mainsTrace === undefined) {
      throw new Error("mainsTrace is undefined while setting original traces in state");
    }

    const mainsIndex = Array.from(Object.keys(mainsTrace.data));
    await this.setSelectedDatetime(
      mainsIndex[0],
      mainsIndex[mainsIndex.length - 1],
      mainsIndex.length
    );

    // deep copy each trace
    this._originalTracesData = [];

    for (const trace of traces) {
      this._originalTracesData.push({
        'idx': trace.idx,
        'name': trace.name,
        'data': JSON.stringify(trace.data),
        'color': trace.color,
      });
    }
  }

  getOriginalTraces(): Trace[] {
    const traces: Trace[] = [];

    for (const traceData of this._originalTracesData) {
      traces.push(new Trace(
        traceData['idx'],
        traceData['name'],
        JSON.parse(traceData['data']),
        traceData['color'],
      ));
    }

    return traces;
  }

  // get or throw
  getSelectedExpOrThrow(): api.exps.ParsedExp {
    if (this._selectedExp === undefined) {
      alert("Please select an experiment first");
      throw new Error("selectedExp is undefined");
    }
    return this._selectedExp;
  }

  getSelectedDurationSamplesOrThrow(): number {
    if (this._selectedDurationSamples === null) {
      throw new Error("selectedDurationSamples is null");
    }
    return this._selectedDurationSamples;
  }

  getSelectedDatetimeRangOrThrow(): api.datetime.DatetimeRange {
    if (this._selectedDatetimeRange === null) {
      throw new Error("selectedDatetimeRange is null");
    }
    return this._selectedDatetimeRange;
  }
}
