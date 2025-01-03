import * as utils from "@/utils/colors";
import * as map from "@/utils/map";
import * as datetime from "@/utils/datetime";
import CustomEventNames from "@/utils/events";

import Canvas from "./canvas";
import State from "./state";

export default class Trace {
  constructor(
    public idx: number,
    public name: string,
    public data: datetime.SimpleDateTimeStringStampedData,
    public color: string = utils.getRndColor(),
  ) { }

  plt(canvas: Canvas, engMin: number, engMax: number, log_options: { log_scale: boolean, log_scale_base: number }) {
    const ctx = canvas.ctx;
    const engVals = Object.values(this.data);
    const simpleDatesStrings = Object.keys(this.data);

    const getXForDate = (dateIdx: number) =>
      map.idxToCanvasX({
        idx: dateIdx,
        idxMin: 0,
        idxMax: simpleDatesStrings.length,
        canvasXMin: canvas.plotArea.x.min,
        canvasXMax: canvas.plotArea.x.max,
      });

    const getYForEng = (eng: number) =>
      map.energyToCanvasY({
        eng,
        engMin,
        engMax,
        canvasYMin: canvas.plotArea.y.min,
        canvasYMax: canvas.plotArea.y.max,
        ...log_options,
      });

    ctx.strokeStyle = this.color;
    const oldLineWidth = ctx.lineWidth;
    ctx.lineWidth = parseInt(canvas.elms.plot.lineWidth.value);
    ctx.beginPath();
    const x = getXForDate(0);
    const y = getYForEng(engVals[0]);
    ctx.moveTo(x, y);
    for (let i = 0; i < engVals.length; i++) {
      const x = getXForDate(i);
      const y = getYForEng(engVals[i]);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = oldLineWidth;
  }

  modify(canvas: Canvas, state: State, engMin: number, engMax: number, mouseCanvasX: number, mouseCanvasY: number, modifyMains: boolean = true) {
    // mouse x corresponds to date
    const dates = Object.keys(this.data);
    const dateIdx = map.canvasXToIdx({
      canvasX: mouseCanvasX,
      idxMin: 0,
      idxMax: dates.length,
      canvasXMin: canvas.plotArea.x.min,
      canvasXMax: canvas.plotArea.x.max,
    });
    // ensure dateIdx is within bounds
    // e.g. not negative or greater than the length of the dates array
    // negative dateIdx would be a result of clicking to the left of the plot area!
    if (dateIdx < 0 || dateIdx >= dates.length) return;

    // mouse y corresponds to energy value
    const newEngVal = map.canvasYToEng({
      canvasY: mouseCanvasY,
      engMin,
      engMax,
      canvasYMin: canvas.plotArea.y.min,
      canvasYMax: canvas.plotArea.y.max,
    });
    // ensure not outside of the energy range
    if (newEngVal < engMin || newEngVal > engMax) return;

    // modify the data
    this.data[dates[dateIdx]] = newEngVal;

    // if modifing appliance data, update the mains data to sum up
    if (modifyMains && this.name !== "mains") {
      const mainsTrace = state.fig?.getTraceByName("mains");
      if (!mainsTrace) return;

      const originalMains = state.getOriginalTraces().filter(trace => trace.name === "mains");
      if (originalMains.length === 0) return;
      const originalMainsVal = originalMains[0].data[dates[dateIdx]];

      // TODO: this solution does not account for a modified mains!!!
      mainsTrace.data[dates[dateIdx]] = originalMainsVal + newEngVal;
    }

    // re-plot the trace
    canvas.clear();
    state.fig?.plot();

    // a trace has been modified => prediction is no longer current
    window.dispatchEvent(new CustomEvent(CustomEventNames.MAINS_IS_MODIFIED));
  }
}
