import constants from "@/utils/constants";

export function getRndColor(): string {
  return `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
}

export function getMatplotlibColor(idx: number): string {
  return constants.matplotlibColors[idx % constants.matplotlibColors.length];
}

// convert hex color to rgb
export function hexToRgb(hex: string) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const rgb = result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
  if (rgb === null) {
    throw new Error("Failed to convert hex color to rgb");
  }
  return rgb;
}

interface ColorPosition {
  pos: number;
  color: string
}

interface ColorMap extends Array<ColorPosition> { }

// predefiened color maps
export const cmaps: Record<string, ColorMap> = {
  // Plasma colormap approximation: color stops from purple to yellow
  plasma: [
    { pos: 0.0, color: "#0d0887" },   // Dark blue/purple
    { pos: 0.25, color: "#7e03a8" },  // Purple
    { pos: 0.5, color: "#cb4679" },   // Pink
    { pos: 0.75, color: "#f89441" },  // Orange
    { pos: 1.0, color: "#f0f921" }    // Yellow
  ]
}


// interpolate colors
export function getInterpolatedRgbColor(value: number, min: number, max: number, cmap: ColorMap): string {
  if (max <= min) {
    throw new Error("Max must be greater than min");
  }

  const normalizedValue = (value - min) / (max - min); // normalize value to a 0-1 scale
  let i = 1;
  for (; i < cmap.length; i++) {
    if (normalizedValue <= cmap[i].pos) {
      break;
    }
  }
  i = Math.max(i, 1); // ensure there's a lower bound
  const lower = cmap[i - 1];
  const upper = cmap[i] || cmap[i - 1]; // handle edge case if value is max

  const range = upper.pos - lower.pos;
  const scale = range === 0 ? 0 : (normalizedValue - lower.pos) / range; // avoid division by zero
  const lColor = hexToRgb(lower.color);
  const uColor = hexToRgb(upper.color);

  const color = {
    r: lColor.r + (uColor.r - lColor.r) * scale,
    g: lColor.g + (uColor.g - lColor.g) * scale,
    b: lColor.b + (uColor.b - lColor.b) * scale
  };
  return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
}