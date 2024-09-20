import Elms from "./elms";
import State from "./state";

import constants from "@/constants";


export default class Canvas {
  elms: Elms;
  state: State;

  constructor(elms: Elms, state: State) {
    this.elms = elms;
    this.state = state;

    this.initSizeCtrl();
    this.initPlotCtrl();
    this.initMouseEvents();
  }

  private initMouseEvents() {
    // capture mouse coords on click
    this.elms.draw.canvas.addEventListener("mousemove", (event) => {
      // if mouse not clicked => return
      // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
      if (event.buttons !== 1) {
        return;
      }

      if (this.elms.data.modify.mains.enabled.checked) {
        const rect = this.elms.draw.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.state.fig !== undefined) {
          const mainsTrace = this.state.fig?.getTraceByName("mains");
          if (
            mainsTrace !== undefined &&
            this.state.fig?.engMin !== undefined &&
            this.state.fig?.engMax !== undefined
          ) {
            mainsTrace?.modify(this, this.state, this.state.fig?.engMin, this.state.fig?.engMax, x, y);
          }
        }
      }
    });
  }

  reset() {
    this.elms.draw.canvas.width = parseInt(this.elms.canvasCtrl.width.value);
    this.elms.draw.canvas.height = parseInt(this.elms.canvasCtrl.height.value);
    this.clear();

    // clear legend
    this.elms.draw.legend.innerHTML = "";

    // replot all traces
    this.state.fig?.plot();
  }

  setLoading() {
    this.reset();

    // draw loading text
    this.ctx.font = `30px ${constants.canvasFontFamily}`;
    this.ctx.fillStyle = "black";
    this.ctx.fillText("Loading...", this.width / 2 - 50, this.height / 2);
  }

  get width(): number {
    return this.elms.draw.canvas.width;
  }

  get height(): number {
    return this.elms.draw.canvas.height;
  }

  get ctx(): CanvasRenderingContext2D {
    const ctx = this.elms.draw.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context not initialized");
    }
    return ctx;
  }

  get plotArea() {
    const pltPadButtom = parseInt(this.elms.plot.padding.buttom.value);
    const pltPadTop = parseInt(this.elms.plot.padding.top.value);
    const pltPadLeft = parseInt(this.elms.plot.padding.left.value);
    const pltPadRight = parseInt(this.elms.plot.padding.right.value);

    return {
      y: {
        min: pltPadTop,
        max: this.height - pltPadButtom,
      },
      x: {
        min: pltPadLeft,
        max: this.width - pltPadRight,
      },
      width: this.width - pltPadLeft - pltPadRight,
      height: this.height - pltPadTop - pltPadButtom,
    };
  }

  private initSizeCtrl = () => {
    this.elms.canvasCtrl.width.value = this.elms.draw.canvas.width.toString();
    this.elms.canvasCtrl.width.addEventListener("change", () => this.reset());

    this.elms.canvasCtrl.height.value = this.elms.draw.canvas.height.toString();
    this.elms.canvasCtrl.height.addEventListener("change", () => this.reset());
  };

  private initPlotCtrl = () => {
    this.elms.plot.lineWidth.addEventListener("change", () => this.reset());
    this.initLabelsCtrl();
    this.elms.plot.padding.buttom.addEventListener("change", () => this.reset());
    this.elms.plot.padding.top.addEventListener("change", () => this.reset());
    this.elms.plot.padding.left.addEventListener("change", () => this.reset());
    this.elms.plot.padding.right.addEventListener("change", () => this.reset());
    this.elms.plot.labels.every.startFromZeroW.addEventListener("change", () => this.reset());
  };

  computeBestXEverySamples(
    spaceBetween: number = 10,
  ) {
    // every how many samples to plot a date label?
    /* How to compute the best distance?
    I. get width of each label in pixels
      1. every label has two lines (time and date) and date is longer (in terms of width which is the 
        relevant part for x)
      2. date has the format dd/mm/yyyy
      3. we are using mono font so each character has the same width
      4. the charWidth is the font size of the labels
      5. so the total width of the date label is 10 * charWidth
    II. get total width available for labels on the plot in pixels
      - although this is fixed number, we need to consider that the number of show samples can change
    III. map from samples to pixels
    IV. leave some space inbetween the labels `spaceBetween`
    */
    const charWidth = parseInt(this.elms.plot.labels.fontSize.value);
    const totalChars = "dd/mm/yyyy".length
    const totalDateWidth = totalChars * charWidth + spaceBetween;

    const nPlottedSamples = this.state.getSelectedDurationSamplesOrThrow();
    const xAreaWidth = this.plotArea.width;
    const xEverySamples = nPlottedSamples * totalDateWidth / xAreaWidth;

    this.elms.plot.labels.every.x.value = xEverySamples.toString()
  }

  private initLabelsCtrl = () => {
    this.elms.plot.labels.fontSize.addEventListener("change", () => this.reset());
    this.elms.plot.labels.every.y.addEventListener("change", () => this.reset());

    // padding buttom
    this.elms.plot.labels.padding.buttom.input.addEventListener("change", () => this.reset());
    this.elms.plot.labels.padding.buttom.reset.addEventListener("click", () => {
      this.elms.plot.labels.padding.buttom.input.value = constants.defaults.labels.padding.buttom.toString();
      this.reset();
    })
  }

  setBg(color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.elms.draw.canvas.width, this.elms.draw.canvas.height);
  }

  clear() {
    this.setBg("white");
  }
}
