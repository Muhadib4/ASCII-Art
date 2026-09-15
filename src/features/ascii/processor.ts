import type { AsciiResult, AsciiSettings, PixelSource } from "./types";

const clamp = (value: number, min = 0, max = 255) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Pure, DOM-free conversion. Both the worker and synchronous fallback use this implementation. */
export function processImage(source: PixelSource, settings: AsciiSettings): AsciiResult {
  if (!Number.isSafeInteger(source.width) || !Number.isSafeInteger(source.height) || source.width <= 0 || source.height <= 0 || source.data.length !== source.width * source.height * 4) {
    throw new Error("This image could not be read. Please try a different file.");
  }
  // Control characters cannot occupy a cell; ordinary spaces at either end are meaningful.
  const rampText = typeof settings.ramp === "string" ? settings.ramp.replace(/[\u0000-\u001f\u007f-\u009f]/g, "") : "";
  const ramp = Array.from(rampText || "@%#*+=-:. ");
  const cols = Math.round(clamp(settings.width, 8, 320));
  const rows = Math.round(clamp((source.height / source.width) * cols * clamp(settings.aspectRatio, 0.15, 2), 1, 500));
  const count = cols * rows;
  const colors = new Uint8ClampedArray(count * 3);
  const alpha = new Uint8ClampedArray(count);
  const light = new Float32Array(count);
  const contrast = clamp(settings.contrast, -100, 100) * 2.55;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const exposure = 2 ** clamp(settings.exposure, -5, 5);
  const gamma = 1 / clamp(settings.gamma, 0.1, 5);
  const saturation = clamp(settings.saturation, 0, 200) / 100;
  const brightness = clamp(settings.brightness, -100, 100) * 2.55;
  const preserveAlpha = settings.transparency === "preserve";

  for (let y = 0; y < rows; y++) {
    const y0 = Math.floor(y * source.height / rows);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * source.height / rows));
    for (let x = 0; x < cols; x++) {
      const x0 = Math.floor(x * source.width / cols);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * source.width / cols));
      let red = 0, green = 0, blue = 0, opacity = 0, samples = 0;
      for (let sy = y0; sy < Math.min(y1, source.height); sy++) {
        for (let sx = x0; sx < Math.min(x1, source.width); sx++) {
          const offset = (sy * source.width + sx) * 4;
          const a = source.data[offset + 3] / 255;
          const bg = preserveAlpha || settings.transparency === "black" ? 0 : 255;
          red += source.data[offset] * a + bg * (1 - a);
          green += source.data[offset + 1] * a + bg * (1 - a);
          blue += source.data[offset + 2] * a + bg * (1 - a);
          opacity += source.data[offset + 3];
          samples++;
        }
      }
      // Average premultiplied color, then unpremultiply once. Compositing against white
      // here and applying alpha again in the renderer would wash out translucent edges.
      const colorWeight = preserveAlpha ? Math.max(opacity / 255, Number.EPSILON) : samples;
      const transform = (value: number) => {
        const exposed = clamp((value / colorWeight) * exposure + brightness);
        const contrasted = clamp(contrastFactor * (exposed - 128) + 128);
        return 255 * (contrasted / 255) ** gamma;
      };
      red = transform(red); green = transform(green); blue = transform(blue);
      const gray = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      red = gray + (red - gray) * saturation;
      green = gray + (green - gray) * saturation;
      blue = gray + (blue - gray) * saturation;
      if (settings.grayscale) red = green = blue = gray;
      const index = y * cols + x;
      colors[index * 3] = settings.invert ? 255 - red : red;
      colors[index * 3 + 1] = settings.invert ? 255 - green : green;
      colors[index * 3 + 2] = settings.invert ? 255 - blue : blue;
      light[index] = settings.invert ? 255 - gray : gray;
      alpha[index] = preserveAlpha ? opacity / samples : 255;
    }
  }

  if (settings.sharpen > 0 || settings.edgeEnhance > 0) {
    const original = light.slice();
    const sample = (x: number, y: number) => original[clamp(y, 0, rows - 1) * cols + clamp(x, 0, cols - 1)];
    const sharpening = clamp(settings.sharpen, 0, 2) * 1.5;
    const emphasis = clamp(settings.edgeEnhance, 0, 2) / 2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x;
        const center = original[index];
        const average = (sample(x - 1, y) + sample(x + 1, y) + sample(x, y - 1) + sample(x, y + 1)) / 4;
        const gx = -sample(x - 1, y - 1) + sample(x + 1, y - 1) - 2 * sample(x - 1, y) + 2 * sample(x + 1, y) - sample(x - 1, y + 1) + sample(x + 1, y + 1);
        const gy = -sample(x - 1, y - 1) - 2 * sample(x, y - 1) - sample(x + 1, y - 1) + sample(x - 1, y + 1) + 2 * sample(x, y + 1) + sample(x + 1, y + 1);
        const edge = 255 - clamp(Math.hypot(gx, gy));
        light[index] = clamp((center + sharpening * (center - average)) * (1 - emphasis) + edge * emphasis);
      }
    }
  }

  const chars = new Array<string>(count);
  const levels = Math.max(1, ramp.length - 1);
  const spread = (x: number, y: number, error: number, weight: number) => {
    if (x >= 0 && x < cols && y >= 0 && y < rows && alpha[y * cols + x] > 0) {
      light[y * cols + x] += error * weight;
    }
  };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const index = y * cols + x;
      if (alpha[index] === 0) { chars[index] = " "; continue; }
      let value = clamp(light[index]);
      if (settings.dither === "bayer") value = clamp(value + ((BAYER[(y % 4) * 4 + x % 4] + 0.5) / 16 - 0.5) * (255 / levels));
      const level = settings.dither === "threshold"
        ? (value >= clamp(settings.threshold) ? ramp.length - 1 : 0)
        : Math.round(value / 255 * (ramp.length - 1));
      chars[index] = ramp[level];
      const error = value - (level / levels) * 255;
      if (settings.dither === "floyd-steinberg") {
        spread(x + 1, y, error, 7 / 16); spread(x - 1, y + 1, error, 3 / 16);
        spread(x, y + 1, error, 5 / 16); spread(x + 1, y + 1, error, 1 / 16);
      } else if (settings.dither === "atkinson") {
        spread(x + 1, y, error, 1 / 8); spread(x + 2, y, error, 1 / 8);
        spread(x - 1, y + 1, error, 1 / 8); spread(x, y + 1, error, 1 / 8);
        spread(x + 1, y + 1, error, 1 / 8); spread(x, y + 2, error, 1 / 8);
      }
    }
  }
  const lines = Array.from({ length: rows }, (_, row) => chars.slice(row * cols, (row + 1) * cols).join(""));
  return { cols, rows, chars, colors, alpha, text: lines.join("\n") };
}
