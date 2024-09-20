export function energyToCanvasY({
  eng,
  engMin,
  engMax,
  canvasYMin,
  canvasYMax,
}: {
  eng: number;
  engMin: number;
  engMax: number;
  canvasYMin: number;
  canvasYMax: number;
}): number {
  // normalize the energy value to a range between 0 and 1
  const normalizedEnergy = (eng - engMin) / (engMax - engMin);

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