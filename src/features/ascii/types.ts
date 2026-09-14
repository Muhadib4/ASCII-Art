export type DitherAlgorithm = "none" | "threshold" | "bayer" | "floyd-steinberg" | "atkinson";
export type ColorMode = "monochrome" | "source" | "duotone" | "gradient" | "ansi";
export type Alignment = "left" | "center" | "right";

export interface AsciiSettings {
  width: number;
  /** Character width divided by character height; 0.5 is a natural monospace ratio. */
  aspectRatio: number;
  brightness: number;
  contrast: number;
  exposure: number;
  gamma: number;
  saturation: number;
  grayscale: boolean;
  threshold: number;
  invert: boolean;
  sharpen: number;
  edgeEnhance: number;
  transparency: "preserve" | "white" | "black";
  /** Characters ordered from darkest to lightest; whitespace is meaningful. */
  ramp: string;
  dither: DitherAlgorithm;
}

export interface PixelSource {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface AsciiResult {
  cols: number;
  rows: number;
  text: string;
  /** Flat row-major array, including spaces. */
  chars: string[];
  /** Flat row-major RGB triplets. */
  colors?: Uint8ClampedArray;
  /** Flat row-major source alpha, 0–255. */
  alpha?: Uint8ClampedArray;
}

export interface ArtworkStyle {
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  alignment: Alignment;
  foreground: string;
  background: string;
  opacity: number;
  glow: number;
  shadow: number;
  border: number;
  padding: number;
  frame: "none" | "line" | "corners" | "double";
  colorMode: ColorMode;
  gradientFrom: string;
  gradientTo: string;
  duotoneDark: string;
  duotoneLight: string;
}

export interface CompositionLayer {
  id: string;
  type: "text" | "title" | "subtitle" | "badge" | "coordinates" | "frame";
  text: string;
  /** Position as a percentage of artwork width and height. */
  x: number;
  y: number;
  fontSize: number;
  color: string;
  opacity: number;
  alignment: Alignment;
  visible: boolean;
}

export interface TextSettings {
  font: "block" | "outline" | "slant" | "dots" | "compact";
  letterSpacing: number;
  lineSpacing: number;
  alignment: Alignment;
  case: "upper" | "lower" | "original";
  width: number;
  scale: number;
  /** The character used to draw lit pixels. */
  density: string;
}

export interface ExportOptions {
  scale?: number;
  transparent?: boolean;
  background?: string;
  includeFrame?: boolean;
  includeLayers?: boolean;
  filename?: string;
}

export const CHARACTER_RAMPS = {
  dense: "@%#*+=-:. ",
  classic: "@#8&o:*. ",
  simple: "█▓▒░ ",
  minimal: "#*:. ",
  binary: "10 ",
  blocks: "█▓▒░ ",
  dots: "●◉•· ",
} as const;

export const DEFAULT_ASCII_SETTINGS: AsciiSettings = {
  width: 100, aspectRatio: 0.48, brightness: 0, contrast: 12,
  exposure: 0, gamma: 1, saturation: 100, grayscale: false,
  threshold: 128, invert: false, sharpen: 0, edgeEnhance: 0,
  transparency: "preserve", ramp: CHARACTER_RAMPS.dense, dither: "none",
};

export const DEFAULT_ARTWORK_STYLE: ArtworkStyle = {
  fontFamily: '"Courier New", monospace', fontSize: 12,
  letterSpacing: 0, lineHeight: 1.04, alignment: "center",
  foreground: "#e8e8e4", background: "#111110", opacity: 1,
  glow: 0, shadow: 0, border: 1, padding: 36, frame: "none",
  colorMode: "monochrome", gradientFrom: "#f0e8d6", gradientTo: "#77756e",
  duotoneDark: "#262b3a", duotoneLight: "#faf3de",
};

export const DEFAULT_TEXT_SETTINGS: TextSettings = {
  font: "block", letterSpacing: 1, lineSpacing: 1,
  alignment: "center", case: "upper", width: 100, scale: 1, density: "█",
};
