import type { PixelSource } from "./types";

export type SampleId = "bust" | "sphere" | "mountains";
const MAX_SOURCE_EDGE = 1600;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Decode locally, then retain only a bounded thumbnail in the editor's undo history. */
export async function loadImageFile(file: File): Promise<PixelSource> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type) && !(file.type === "" && /\.(jpe?g|png|webp|gif)$/i.test(file.name))) {
    throw new Error("Choose a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > 30 * 1024 * 1024) throw new Error("This image is larger than 30 MB. Choose a smaller file.");
  if (file.size === 0) throw new Error("This file is empty. Choose a different image.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Invalid image dimensions.");
    const scale = Math.min(1, MAX_SOURCE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Your browser cannot read this image. Try a different browser.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    // Animated images are drawn once. The output is a still frame, never an animation.
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
  } catch (error) {
    if (error instanceof Error && error.message.includes("browser")) throw error;
    throw new Error("This image could not be decoded. It may be damaged or use an unsupported format.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Ellipsoid = readonly [cx: number, cy: number, rx: number, ry: number, rz: number, depth: number];
const BUST: Ellipsoid[] = [
  [0, 0.72, 0.7, 0.23, 0.28, -0.2], [0.01, 0.48, 0.25, 0.35, 0.24, -0.07],
  [0, -0.19, 0.38, 0.59, 0.31, 0], [0.05, 0.23, 0.27, 0.2, 0.26, 0.05],
  [-0.37, -0.12, 0.07, 0.16, 0.095, 0.05], [0.37, -0.12, 0.07, 0.16, 0.095, 0.05],
  [0.025, -0.09, 0.066, 0.21, 0.115, 0.28], [0.035, 0.065, 0.1, 0.065, 0.09, 0.3],
  [-0.16, -0.31, 0.13, 0.047, 0.065, 0.29], [0.16, -0.31, 0.13, 0.047, 0.065, 0.29],
  [0.015, 0.2, 0.13, 0.024, 0.045, 0.27], [0.015, 0.24, 0.11, 0.03, 0.043, 0.26],
];
for (let i = 0; i < 19; i++) {
  const angle = Math.PI + i / 18 * Math.PI;
  const x = Math.cos(angle) * 0.32;
  const y = -0.35 + Math.sin(angle) * 0.34;
  BUST.push([x, y, 0.08 + (i % 3) * 0.012, 0.1, 0.14, 0.23]);
}

function bustPixel(x: number, y: number): number {
  let depth = -Infinity, luminance = 255;
  for (const [cx, cy, rx, ry, rz, z] of BUST) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const remainder = 1 - dx * dx - dy * dy;
    if (remainder <= 0) continue;
    const dz = Math.sqrt(remainder);
    const surface = z + dz * rz;
    if (surface <= depth) continue;
    depth = surface;
    const nx = dx / rx, ny = dy / ry, nz = dz / rz;
    const length = Math.hypot(nx, ny, nz);
    const diffuse = Math.max(0, (-nx * 0.65 - ny * 0.45 + nz * 0.6) / length);
    luminance = 28 + diffuse * 170;
  }
  if (!Number.isFinite(depth)) return 255;
  const eyes = Math.exp(-(((x + 0.15) / 0.082) ** 2 + ((y + 0.2) / 0.042) ** 2)) + Math.exp(-(((x - 0.16) / 0.082) ** 2 + ((y + 0.2) / 0.042) ** 2));
  const lips = Math.exp(-(((x - 0.015) / 0.11) ** 6 + ((y - 0.217) / 0.013) ** 2));
  const texture = Math.sin(x * 139 + y * 61) * Math.sin(y * 211 - x * 29) * 5;
  return Math.max(0, Math.min(240, luminance - eyes * 75 - lips * 75 + texture));
}

/** Deterministic, bundled visual studies: no network request or private source asset. */
export function createSampleImage(id: SampleId = "bust"): PixelSource {
  const width = 560, height = 640;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = (x / width - 0.5) * 2, py = (y / height - 0.5) * 2;
      let value = 255, red = 1, green = 1, blue = 1;
      if (id === "bust") {
        value = bustPixel(px, py);
        red = 1; green = 0.96; blue = 0.89;
      } else if (id === "sphere") {
        const radius = Math.hypot(px, py);
        if (radius < 0.72) {
          const z = Math.sqrt(0.72 ** 2 - radius ** 2);
          const light = Math.max(0, (-px * 0.7 - py * 0.45 + z * 0.55) / 0.72);
          const bands = Math.sin((py + px * 0.15) * 60 + z * 6) * 8;
          value = 18 + light * 185 + bands;
          red = 0.83; green = 0.91;
        }
      } else {
        const ridge1 = 0.2 - Math.abs(Math.sin(px * 2.1 + 0.3)) * 0.67;
        const ridge2 = 0.51 - Math.abs(Math.sin(px * 2.8 - 0.7)) * 0.7;
        const ridge3 = 0.78 - Math.abs(Math.sin(px * 2.4 + 2.4)) * 0.64;
        const grain = Math.sin(px * 133 + py * 27) * Math.cos(py * 89) * 7;
        if (py > ridge1) value = 165 + grain;
        if (py > ridge2) value = 100 + grain * 2;
        if (py > ridge3) value = 34 + grain;
        if (Math.hypot(px - 0.5, py + 0.59) < 0.13) value = 112;
        red = 0.84; green = 0.93;
      }
      const index = (y * width + x) * 4;
      data[index] = value === 255 ? 255 : value * red;
      data[index + 1] = value === 255 ? 255 : value * green;
      data[index + 2] = value === 255 ? 255 : value * blue;
      data[index + 3] = 255;
    }
  }
  return { data, width, height };
}

export const createSampleSource = createSampleImage;
