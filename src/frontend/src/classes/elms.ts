export default class Elms {
  draw = {
    canvas: document.querySelector("#pltCanvas") as HTMLCanvasElement,
    legend: document.querySelector("#legend") as HTMLDivElement,
    info: document.querySelector("#info") as HTMLDivElement,
  };
  quickCtrl = {
    shift: {
      durationSamples: document.querySelector("#shiftDurationSamples") as HTMLInputElement,
      nextDay: document.querySelector("#shiftNextDayData") as HTMLButtonElement,
      prevDay: document.querySelector("#shiftPrevDayData") as HTMLButtonElement,
      next: document.querySelector("#shiftNextDurationData") as HTMLButtonElement,
      prev: document.querySelector("#shiftPrevDurationData") as HTMLButtonElement,
    },
    zoom: document.querySelector("#zoom") as HTMLButtonElement,
  };
  canvasCtrl = {
    width: document.querySelector("#canvasWidth") as HTMLInputElement,
    height: document.querySelector("#canvasHeight") as HTMLInputElement,
  };
  expInfo = document.querySelector("#expInfo") as HTMLDivElement;
  data = {
    dataset: document.querySelector("#dataset") as HTMLSelectElement,
    house: document.querySelector("#house") as HTMLSelectElement,
    app: document.querySelector("#app") as HTMLSelectElement,
    exp: document.querySelector("#exp") as HTMLSelectElement,
    pick: {
      date: document.querySelector("#datePicker") as HTMLInputElement,
      startTime: document.querySelector("#startTimePicker") as HTMLInputElement,
      durationSamples: document.querySelector("#durationSamples") as HTMLInputElement,
      get: document.querySelector("#getData") as HTMLButtonElement,
    },
    info: {
      traintest: document.querySelector("#dataInfo .traintest") as HTMLParagraphElement,
      dayname: document.querySelector("#dataInfo .dayname") as HTMLParagraphElement,
      holiday: document.querySelector("#dataInfo .holiday") as HTMLParagraphElement,
      weekend: document.querySelector("#dataInfo .weekend") as HTMLParagraphElement,
    },
    randomData: document.querySelector("#randomData") as HTMLButtonElement,
    randomDataOnlyActive: document.querySelector("#randomDataOnlyActive") as HTMLInputElement,
    err: {
      numErrBins: document.querySelector("#numErrBins") as HTMLInputElement,
      errHistCanvas: document.querySelector("#errHistCanvas") as HTMLCanvasElement,
      errBin: document.querySelector("#errBin") as HTMLInputElement,
      durationSamples: document.querySelector("#errGetDuration") as HTMLInputElement,
      get: document.querySelector("#getRndDataWithErr") as HTMLButtonElement,
      info: {
        range: {
          from: document.querySelector("#errRangeFrom") as HTMLSpanElement,
          to: document.querySelector("#errRangeTo") as HTMLSpanElement,
        },
        numWindows: document.querySelector("#errNumWindows") as HTMLSpanElement,
      },
    },
    modify: {
      mains: {
        enabled: document.querySelector("#modifyMains") as HTMLInputElement,
        reset: document.querySelector("#resetMains") as HTMLButtonElement,
      }
    },
  };
  mean = {
    watts: document.querySelector("#meanWatts") as HTMLSpanElement,
    show: document.querySelector("#showMean") as HTMLInputElement,
  }
  std = {
    threshold: document.querySelector("#stdThreshold") as HTMLInputElement,
    watts: document.querySelector("#stdWatts") as HTMLSpanElement,
    show: document.querySelector("#showStds") as HTMLInputElement,
  };
  suntimes = {
    show: document.querySelector("#showSuntimes") as HTMLInputElement,
    lineWidth: document.querySelector("#suntimesLineWidth") as HTMLInputElement,
  };
  prediction = {
    model: document.querySelector("#model") as HTMLSelectElement,
    modelInfo: document.querySelector("#modelInfo") as HTMLDivElement,
    selectExpModel: document.querySelector("#selectExpModel") as HTMLButtonElement,
    predict: document.querySelector("#predict") as HTMLButtonElement,
    live: {
      enabled: document.querySelector("#livePredictionEnabled") as HTMLInputElement,
      graceSec: document.querySelector("#livePredictionGracePeriodSec") as HTMLInputElement,
    }
  };
  snapshot = {
    name: document.querySelector("#snapshotName") as HTMLInputElement,
    desc: document.querySelector("#snapshotDesc") as HTMLTextAreaElement,
    take: document.querySelector("#snapshotTake") as HTMLButtonElement,
    save: document.querySelector("#snapshotSave") as HTMLButtonElement,
  };
  fm = {
    width: document.querySelector("#fm #fmWidth") as HTMLInputElement,
    height: document.querySelector("#fm #fmHeight") as HTMLInputElement,
    get: document.querySelector("#fm button") as HTMLButtonElement,
    canvasContainer: document.querySelector("#fm #canvasContainer") as HTMLCanvasElement,
  };
  plot = {
    logScale: document.querySelector("#logScale") as HTMLInputElement,
    lineWidth: document.querySelector("#lineWidth") as HTMLInputElement,
    padding: {
      buttom: document.querySelector("#paddingButtom") as HTMLInputElement,
      top: document.querySelector("#paddingTop") as HTMLInputElement,
      left: document.querySelector("#paddingLeft") as HTMLInputElement,
      right: document.querySelector("#paddingRight") as HTMLInputElement,
    },
    labels: {
      fontSize: document.querySelector("#labelsFontSize") as HTMLInputElement,
      padding: {
        buttom: {
          input: document.querySelector("#labelsPaddingButtom") as HTMLInputElement,
          reset: document.querySelector("#labelsPaddingButtomReset") as HTMLButtonElement,
        }
      },
      every: {
        x: document.querySelector("#xLabelEvery") as HTMLInputElement,
        y: document.querySelector("#yLabelEvery") as HTMLInputElement,
        startFromZeroW: document.querySelector("#startFromZeroW") as HTMLInputElement,
      },
    },
  };
  snapshotsContainer = document.querySelector("#snapshotsContainer") as HTMLDivElement;
}