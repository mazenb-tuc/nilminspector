export function energyToCanvasY({
  eng,
  engMin,
  engMax,
  canvasYMin,
  canvasYMax,
  log_scale = false,
  log_scale_base = Math.E,
}: {
  eng: number;
  engMin: number;
  engMax: number;
  canvasYMin: number;
  canvasYMax: number;
  log_scale: boolean;
  log_scale_base: number;
}): number {
  // determine the offset needed to make all energy values positive if using logarithmic scale
  let offset = 0;
  if (log_scale) {
    const minEng = Math.min(eng, engMin, engMax);
    if (minEng <= 0) {
      offset = -minEng + 1;  // add 1 to ensure all values are strictly greater than 0
    }
  }

  // normalize the energy value to a range between 0 and 1
  let normalizedEnergy: number;
  if (log_scale) {
    // apply offset and convert to logarithmic scale using specified base
    const logEng = Math.log(eng + offset) / Math.log(log_scale_base);
    const logMin = Math.log(engMin + offset) / Math.log(log_scale_base);
    const logMax = Math.log(engMax + offset) / Math.log(log_scale_base);
    normalizedEnergy = (logEng - logMin) / (logMax - logMin);
  } else {
    // linear scale normalization
    normalizedEnergy = (eng - engMin) / (engMax - engMin);
  }

  // map linearly to canvas range
  const canvas = canvasYMin + normalizedEnergy * (canvasYMax - canvasYMin);

  // flip the y axis since canvas y increases from top to bottom
  let flipped = canvas;
  flipped -= canvasYMin;
  flipped = canvasYMax - flipped;

  return flipped;
}


export function idxToCanvasX({
  idx,
  idxMin,
  idxMax,
  canvasXMin,
  canvasXMax,
}: {
  idx: number;
  idxMin: number;
  idxMax: number;
  canvasXMin: number;
  canvasXMax: number;
}): number {
  // normalize the date index value to a range between 0 and 1
  const normalizedDateIdx = (idx - idxMin) / (idxMax - idxMin);

  // map linearly to canvas range
  const canvas = canvasXMin + normalizedDateIdx * (canvasXMax - canvasXMin);

  return canvas;
}

export function dateToCanvasX({
  date,
  dates,
  canvasXMin,
  canvasXMax,
}: {
  date: Date;
  dates: Date[];
  canvasXMin: number;
  canvasXMax: number;
}): number {
  // nearest date to canvas x

  // sort dates
  dates.sort((a, b) => a.getTime() - b.getTime());
  const dateMinTime = dates[0].getTime();
  const dateMaxTime = dates[dates.length - 1].getTime();

  // normalize given date
  const normalizedDate = (date.getTime() - dateMinTime) / (dateMaxTime - dateMinTime);

  // map linearly to canvas range
  const canvas = canvasXMin + normalizedDate * (canvasXMax - canvasXMin);

  return canvas;
}

export function canvasXToIdx({
  canvasX,
  idxMin,
  idxMax,
  canvasXMin,
  canvasXMax,
}: {
  canvasX: number;
  idxMin: number;
  idxMax: number;
  canvasXMin: number;
  canvasXMax: number;
}): number {
  // normalize the canvas x value to a range between 0 and 1
  const normalizedCanvasX = (canvasX - canvasXMin) / (canvasXMax - canvasXMin);

  // map linearly to index range
  const idxFloat = idxMin + normalizedCanvasX * (idxMax - idxMin);

  // round to nearest integer
  // Note: not always in the same direction (i.e. always rounding down or up) to avoid bias
  // this happens when x range is large and thus it is hard to click on a specific x value
  let idx = Math.ceil(idxFloat);
  if (Math.random() < 0.5) {
    idx = Math.floor(idxFloat);
  }

  return idx;
}

export function canvasYToEng({
  canvasY,
  engMin,
  engMax,
  canvasYMin,
  canvasYMax,
}: {
  canvasY: number;
  engMin: number;
  engMax: number;
  canvasYMin: number;
  canvasYMax: number;
}): number {
  // normalize the canvas y value to a range between 0 and 1
  const normalizedCanvasY = (canvasY - canvasYMin) / (canvasYMax - canvasYMin);

  // map linearly to energy range
  const eng = engMin + normalizedCanvasY * (engMax - engMin);

  let flipped = eng;
  flipped -= engMin;
  flipped = engMax - flipped;
  return flipped;
}
