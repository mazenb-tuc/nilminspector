import constants from "@/constants";
import * as map from "@/utils/map";

import Elms from "./elms";
import Trace from "./trace";
import Canvas from "./canvas";
import State from "./state";


export default class Fig {
  engMin: number;
  engMax: number;

  constructor(
    public elms: Elms,
    public canvas: Canvas,
    public state: State,
    public traces: Trace[],
  ) {
    this.engMin = this.traces.reduce((acc, trace) => Math.min(acc, ...Object.values(trace.data)), 0);
    this.engMax = this.traces.reduce((acc, trace) => Math.max(acc, ...Object.values(trace.data)), 0);
  }

  getTraceByName(name: string): Trace | undefined {
    return this.traces.find((trace) => trace.name === name);
  }

  private addLegendItem(name: string, color: string) {
    const legendItem = document.createElement("span");
    legendItem.classList.add("legend-item");
    legendItem.style.color = color;
    legendItem.textContent = name;
    this.elms.draw.legend.appendChild(legendItem);
  }

  private pltXAxis(
    ctx: CanvasRenderingContext2D,
    datesStrings: string[],
    labelsPaddingBottom: number,
  ) {
    const xEvery: number = parseInt(this.elms.plot.labels.every.x.value);
    const labelsFontSize = parseInt(this.elms.plot.labels.fontSize.value);
    const lineHeight = labelsFontSize + 5;
    ctx.font = `${labelsFontSize}px ${constants.canvasFontFamily}`;
    ctx.fillStyle = "black";
    const getXForDate = (dateIdx: number) =>
      map.idxToCanvasX({
        idx: dateIdx,
        idxMin: 0,
        idxMax: datesStrings.length,
        canvasXMin: this.canvas.plotArea.x.min,
        canvasXMax: this.canvas.plotArea.x.max,
      });

    for (let i = 0; i < datesStrings.length; i += xEvery) {
      const date = new Date(datesStrings[i]);
      const x = getXForDate(i);

      // date on first line
      const dateStr = date.toLocaleDateString();
      ctx.fillText(dateStr, x, this.canvas.height - 2 * lineHeight + labelsPaddingBottom);

      // time on second line
      const dateTime = date.toLocaleTimeString();
      ctx.fillText(dateTime, x, this.canvas.height - 3 * lineHeight + labelsPaddingBottom);

      // vertical grid line at this date
      ctx.beginPath();
      ctx.strokeStyle = "lightgray";
      ctx.moveTo(x, this.canvas.plotArea.y.min);
      ctx.lineTo(x, this.canvas.plotArea.y.max);
      ctx.stroke();
    }
  }

  private pltYAxis(ctx: CanvasRenderingContext2D) {
    const yEvery = parseInt(this.elms.plot.labels.every.y.value);
    const labelsFontSize = parseInt(this.elms.plot.labels.fontSize.value);
    ctx.font = `${labelsFontSize}px ${constants.canvasFontFamily}`;
    ctx.fillStyle = "black";

    const getYForEng = (eng: number) =>
      map.energyToCanvasY({
        eng,
        engMin: this.engMin,
        engMax: this.engMax,
        canvasYMin: this.canvas.plotArea.y.min,
        canvasYMax: this.canvas.plotArea.y.max,
      });

    // generate list of eng levels for each tick
    let engTicks = [];
    if (this.elms.plot.labels.every.startFromZeroW.checked) {
      // add levels below 0 with distances of yEvery
      for (let eng = 0; eng >= this.engMin; eng -= yEvery) {
        engTicks.push(eng);
      }
      // add levels above 0 with distances of yEvery
      for (let eng = yEvery; eng <= this.engMax; eng += yEvery) {
        engTicks.push(eng);
      }
      // sort
      engTicks = engTicks.sort((a, b) => a - b);
    } else {
      for (let eng = this.engMin; eng <= this.engMax; eng += yEvery) {
        engTicks.push(eng);
      }
    }

    for (const eng of engTicks) {
      const y = getYForEng(eng);
      const roundedEng = Math.round(eng);

      // label (energy value) on the left
      const engStr = roundedEng.toString();
      ctx.fillText(`${engStr}W`, 0, y);

      // horizontal grid line at this energy value
      ctx.beginPath();
      ctx.strokeStyle = "lightgray";
      ctx.moveTo(this.canvas.plotArea.x.min, y);
      ctx.lineTo(this.canvas.plotArea.x.max, y);
      ctx.stroke();
    }
  }

  private pltAxis(datesStrings: string[]) {
    const ctx = this.canvas.ctx;
    const labelsPaddingBottom = parseInt(this.elms.plot.labels.padding.buttom.input.value);

    this.pltXAxis(ctx, datesStrings, labelsPaddingBottom);
    this.pltYAxis(ctx);
  }

  private plotTraces() {
    this.traces.forEach((trace) => {
      trace.plt(this.canvas, this.engMin, this.engMax);
      this.addLegendItem(trace.name, trace.color);
    });
  }

  private clearLegend() {
    this.elms.draw.legend.innerHTML = "";
  }

  private plotVLine(ctx: CanvasRenderingContext2D, watts: number, color: string) {
    ctx.strokeStyle = color;
    const y = map.energyToCanvasY({
      eng: watts,
      engMin: this.engMin,
      engMax: this.engMax,
      canvasYMin: this.canvas.plotArea.y.min,
      canvasYMax: this.canvas.plotArea.y.max,
    });
    ctx.beginPath();
    ctx.moveTo(this.canvas.plotArea.x.min, y);
    ctx.lineTo(this.canvas.plotArea.x.max, y);
    ctx.stroke();
  }

  private plotStdLines() {
    // plot dashed horizontal lines for stdWatts values
    if (this.elms.std.show.checked && this.state.stdWatts != null) {
      const ctx = this.canvas.ctx;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;

      this.plotVLine(ctx, this.state.stdWatts.lower, 'red');
      this.plotVLine(ctx, this.state.stdWatts.upper, 'red');

      // reset line style
      ctx.setLineDash([]);
    }
  }

  private plotMeanLine() {
    // plot dashed horizontal line for mean value
    if (this.elms.mean.show.checked && this.state.stdWatts != null) {
      const ctx = this.canvas.ctx;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;

      this.plotVLine(ctx, this.state.stdWatts.mean, 'gray');

      // reset line style
      ctx.setLineDash([]);
    }
  }

  private plotSunTimes() {
    // plotting enabled?
    if (!this.elms.suntimes.show.checked) {
      return;
    }

    // do we have the required data?
    const dayInfo = this.state.selectedDayInfo;
    if (dayInfo === null || dayInfo.sunrise === null || dayInfo.sunset === null) {
      return;
    }
    const mainsTrace = this.getTraceByName("mains")
    if (mainsTrace === undefined) {
      return;
    }

    const dates = Object.keys(mainsTrace.data).map((dateStr) => new Date(dateStr));
    const getXForDate = (date: Date) =>
      map.dateToCanvasX({
        date,
        dates,
        canvasXMin: this.canvas.plotArea.x.min,
        canvasXMax: this.canvas.plotArea.x.max,
      });

    const sunriseX = getXForDate(new Date(dayInfo.sunrise));
    const sunsetX = getXForDate(new Date(dayInfo.sunset));

    // plot dashed vertical lines
    const ctx = this.canvas.ctx;
    ctx.setLineDash([5, 5]);
    const oldLineWidth = ctx.lineWidth;
    // ctx.lineWidth = parseInt(this.elms.plot.lineWidth.value);
    ctx.lineWidth = parseFloat(this.elms.suntimes.lineWidth.value)

    // for text (labels on top of the lines)
    const labelsFontSize = parseInt(this.elms.plot.labels.fontSize.value);
    ctx.font = `${labelsFontSize}px ${constants.canvasFontFamily}`;
    const margin = 5;

    // for sunrise
    if (sunriseX > this.canvas.plotArea.x.min && sunriseX < this.canvas.plotArea.x.max) {
      ctx.strokeStyle = constants.colors.sunrise;
      ctx.fillStyle = constants.colors.sunrise;
      ctx.fillText("Sunrise", sunriseX + margin, 20);
      ctx.beginPath();
      ctx.moveTo(sunriseX, this.canvas.plotArea.y.min);
      ctx.lineTo(sunriseX, this.canvas.plotArea.y.max);
      ctx.stroke();
    }

    // and sunset
    if (sunsetX > this.canvas.plotArea.x.min && sunsetX < this.canvas.plotArea.x.max) {
      ctx.strokeStyle = constants.colors.sunset;
      ctx.fillStyle = constants.colors.sunset;
      ctx.fillText("Sunset", sunsetX + margin, 20);
      ctx.beginPath();
      ctx.moveTo(sunsetX, this.canvas.plotArea.y.min);
      ctx.lineTo(sunsetX, this.canvas.plotArea.y.max);
      ctx.stroke();
    }

    // reset line style
    ctx.setLineDash([]);
    ctx.lineWidth = oldLineWidth;
  }

  plot() {
    this.clearLegend();
    this.plotTraces();
    this.plotStdLines()
    this.plotMeanLine()
    this.plotSunTimes()

    this.canvas.computeBestXEverySamples()
    const datesStrings = Object.keys(this.traces[0].data);
    this.pltAxis(datesStrings);
  }
}