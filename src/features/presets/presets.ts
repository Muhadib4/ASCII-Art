import type { AsciiSettings, ArtworkStyle, TextSettings } from "@/features/ascii/types";
import { DEFAULT_ASCII_SETTINGS, DEFAULT_ARTWORK_STYLE, DEFAULT_TEXT_SETTINGS } from "@/features/ascii/types";

export interface StudioPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  glyph: string;
  ascii: Partial<AsciiSettings>;
  style: Partial<ArtworkStyle>;
  textSettings?: Partial<TextSettings>;
}

export const presets: StudioPreset[] = [
  { id: "terminal-portrait", name: "Terminal Portrait", category: "CLASSIC", description: "Sculptural detail, expressed in a dense character set.", glyph: "@#", ascii: { width: 100, contrast: 22, gamma: 1.05, ramp: "@#8&o:*. ", dither: "none" }, style: { foreground: "#e8e8e4", background: "#111110", fontSize: 12, padding: 36 } },
  { id: "hacker-console", name: "Hacker Console", category: "TERMINAL", description: "Tight phosphor characters with a sharpened edge.", glyph: ">_", ascii: { width: 115, contrast: 32, sharpen: 1, ramp: "@%#*+=-:. ", invert: true }, style: { foreground: "#88ef9a", background: "#07140b", glow: 4, frame: "corners", padding: 44 } },
  { id: "newspaper", name: "Newspaper Halftone", category: "PRINT", description: "Ordered dots and warm paper. A little analog.", glyph: "::", ascii: { width: 95, dither: "bayer", contrast: 38, brightness: 5, ramp: "●•· ", grayscale: true }, style: { foreground: "#26221b", background: "#eee8d8", fontSize: 13, lineHeight: 1.15, padding: 48 } },
  { id: "dot-matrix", name: "Dot Matrix", category: "PRINT", description: "An early digital impression, one dot at a time.", glyph: "··", ascii: { width: 100, dither: "atkinson", ramp: "●· ", contrast: 25, sharpen: 0.5 }, style: { foreground: "#343733", background: "#e0e5d1", letterSpacing: 1, lineHeight: 1.2, border: 2 } },
  { id: "matrix", name: "Matrix Terminal", category: "TERMINAL", description: "A luminous stream of binary light.", glyph: "01", ascii: { width: 125, ramp: "1010 ", invert: true, contrast: 45, dither: "floyd-steinberg" }, style: { colorMode: "gradient", gradientFrom: "#c0ffd3", gradientTo: "#14ad50", background: "#030a05", glow: 3, lineHeight: 1.08 } },
  { id: "crt", name: "CRT", category: "TERMINAL", description: "Warm amber glow from a forgotten workstation.", glyph: "[]", ascii: { width: 84, ramp: "█▓▒░ ", contrast: 20, dither: "bayer", invert: true }, style: { foreground: "#ffca78", background: "#1b1107", glow: 5, lineHeight: 1.25, frame: "double", padding: 52 } },
  { id: "blueprint", name: "Blueprint", category: "DESIGN", description: "Architectural contours on a deep blue field.", glyph: "+─", ascii: { width: 110, edgeEnhance: 0.8, contrast: 28, ramp: "#*+:. ", invert: true }, style: { foreground: "#c9eaff", background: "#143961", frame: "line", border: 1, padding: 48, letterSpacing: 0.2 } },
  { id: "ascii-poster", name: "ASCII Poster", category: "DESIGN", description: "A bold composition with generous breathing room.", glyph: "Aa", ascii: { width: 80, contrast: 42, dither: "atkinson", ramp: "@#:. " }, style: { foreground: "#191916", background: "#f0efdf", padding: 90, fontSize: 13, frame: "corners", border: 2 }, textSettings: { font: "block", letterSpacing: 2, density: "█" } },
  { id: "binary-portrait", name: "Binary Portrait", category: "EXPERIMENT", description: "The world reduced to one, zero, and the space between.", glyph: "10", ascii: { width: 110, ramp: "10 ", dither: "floyd-steinberg", contrast: 25, gamma: 0.9 }, style: { foreground: "#f1f1eb", background: "#1b1b19", lineHeight: 1.1, letterSpacing: 0.25 } },
  { id: "pixel-blocks", name: "Pixel Blocks", category: "EXPERIMENT", description: "Chunky blocks that keep the color of your source.", glyph: "▓░", ascii: { width: 65, ramp: "█▓▒░ ", dither: "none", saturation: 125, contrast: 15 }, style: { colorMode: "source", background: "#121419", fontSize: 15, letterSpacing: -1, lineHeight: 0.95, padding: 32 } },
  { id: "minimal-mono", name: "Minimal Mono", category: "CLASSIC", description: "Four marks. Nothing more than necessary.", glyph: "#.", ascii: { width: 78, ramp: "#*:. ", contrast: 20, brightness: 10, dither: "none" }, style: { foreground: "#ddddda", background: "#171715", padding: 52, lineHeight: 1.13, border: 0 } },
  { id: "retro-computer", name: "Retro Computer", category: "TERMINAL", description: "Low resolution, high nostalgia.", glyph: "■_", ascii: { width: 65, ramp: "█▓▒░ ", dither: "bayer", contrast: 15, invert: true }, style: { foreground: "#bcb4ff", background: "#39316e", fontSize: 16, padding: 46, frame: "double", lineHeight: 1.2 } },
  { id: "cyber-ascii", name: "Cyber ASCII", category: "EXPERIMENT", description: "Electric edges in a violet-to-cyan spectrum.", glyph: "//", ascii: { width: 110, edgeEnhance: 0.5, contrast: 35, dither: "atkinson", invert: true }, style: { colorMode: "gradient", gradientFrom: "#db9bff", gradientTo: "#83e8ff", background: "#120e23", glow: 4, frame: "corners", padding: 42 } },
  { id: "winter-ascii", name: "Winter ASCII", category: "ATMOSPHERE", description: "Airy characters in quiet, icy tones.", glyph: "*·", ascii: { width: 92, ramp: "*+:. ", brightness: 18, contrast: 8, gamma: 1.2, dither: "atkinson" }, style: { colorMode: "duotone", duotoneDark: "#4d6d86", duotoneLight: "#edfaff", background: "#0e1e2b", lineHeight: 1.2, padding: 58, glow: 1 } },
];

export function getPresetSettings(id: string) {
  const preset = presets.find((item) => item.id === id);
  if (!preset) return null;
  return {
    ascii: { ...DEFAULT_ASCII_SETTINGS, ...preset.ascii },
    style: { ...DEFAULT_ARTWORK_STYLE, ...preset.style },
    textSettings: { ...DEFAULT_TEXT_SETTINGS, ...preset.textSettings },
  };
}

export function rememberPreset(id: string) {
  try {
    const previous: unknown = JSON.parse(localStorage.getItem("ascii-recent-presets") || "[]");
    const list = Array.isArray(previous) ? previous.filter((value): value is string => typeof value === "string") : [];
    localStorage.setItem("ascii-recent-presets", JSON.stringify([id, ...list.filter((value) => value !== id)].slice(0, 6)));
  } catch { /* Presets remain usable when browser storage is disabled. */ }
}
