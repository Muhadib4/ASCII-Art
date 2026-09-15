import type { ArtworkStyle, AsciiResult, CompositionLayer, ExportOptions } from "./types";

export interface ArtworkDimensions { width: number; height: number; cellWidth: number; cellHeight: number; padding: number }
export interface ArtworkGlyph { text: string; x: number; y: number; size: number; color: string; opacity: number; glow: number; shadow: number }
export interface ArtworkLine { x1: number; y1: number; x2: number; y2: number; color: string; width: number; opacity: number }
export interface ArtworkRectangle { x: number; y: number; width: number; height: number; color: string; lineWidth: number; opacity: number; fill?: string }
export interface ArtworkScene extends ArtworkDimensions { glyphs: ArtworkGlyph[]; lines: ArtworkLine[]; rectangles: ArtworkRectangle[]; background: string | null; fontFamily: string }

const bounded = (value: number, low: number, high: number) => Number.isFinite(value) ? Math.max(low, Math.min(high, value)) : low;

export function getArtworkDimensions(result: AsciiResult, style: ArtworkStyle): ArtworkDimensions {
  if (!Number.isSafeInteger(result.cols) || !Number.isSafeInteger(result.rows) || result.cols < 1 || result.rows < 1 || result.cols * result.rows > 500_000 || result.chars.length !== result.cols * result.rows) {
    throw new Error("This artwork has invalid dimensions. Generate the artwork again.");
  }
  const fontSize = bounded(style.fontSize, 4, 96);
  const cellWidth = Math.max(1, fontSize * 0.6 + bounded(style.letterSpacing, -3, 20));
  const cellHeight = fontSize * bounded(style.lineHeight, 0.6, 3);
  const padding = bounded(style.padding, 0, 240);
  return { width: Math.max(1, Math.ceil(result.cols * cellWidth + padding * 2)), height: Math.max(1, Math.ceil(result.rows * cellHeight + padding * 2)), cellWidth, cellHeight, padding };
}

function rgb(hex: string): [number, number, number] {
  const value = hex.replace(/^#/, "");
  if (/^[a-f\d]{3}$/i.test(value)) return [parseInt(value[0] + value[0], 16), parseInt(value[1] + value[1], 16), parseInt(value[2] + value[2], 16)];
  if (/^[a-f\d]{6}$/i.test(value)) return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
  return [255, 255, 255];
}

function mix(start: [number, number, number], end: [number, number, number], value: number): string {
  const t = bounded(value, 0, 1);
  return `rgb(${start.map((channel, index) => Math.round(channel + (end[index] - channel) * t)).join(",")})`;
}

const ANSI = ["#101014", "#cc5555", "#65b46a", "#d6bf69", "#647bd6", "#ae6ccd", "#5abdb6", "#c4c4c4", "#767680", "#ff7777", "#99e598", "#f4e49b", "#98acfa", "#d99af0", "#8de8e1", "#ffffff"].map(color => ({ color, channels: rgb(color) }));

/** A single scene description feeds both Canvas preview/PNG and vector SVG export. */
export function buildArtworkScene(result: AsciiResult, style: ArtworkStyle, layers: CompositionLayer[] = [], options: ExportOptions = {}): ArtworkScene {
  const dimensions = getArtworkDimensions(result, style);
  const scene: ArtworkScene = { ...dimensions, glyphs: [], lines: [], rectangles: [], background: options.transparent ? null : options.background ?? style.background, fontFamily: style.fontFamily };
  const { width, height, padding, cellWidth, cellHeight } = dimensions;
  const gradientFrom = rgb(style.gradientFrom), gradientTo = rgb(style.gradientTo);
  const dark = rgb(style.duotoneDark), light = rgb(style.duotoneLight);
  const size = bounded(style.fontSize, 4, 96);
  const opacity = bounded(style.opacity, 0, 1);
  // Align the complete grid as one shape. Aligning each bitmap row separately
  // changes the geometry of letters such as A, J, and every slanted banner.
  let offset = 0;
  if (!result.colors) {
    let first = result.cols, last = -1;
    result.chars.forEach((char, index) => {
      if (char !== " " && char !== "\t") { first = Math.min(first, index % result.cols); last = Math.max(last, index % result.cols); }
    });
    if (last >= 0) offset = (style.alignment === "right" ? result.cols - (last - first + 1) : style.alignment === "center" ? Math.floor((result.cols - (last - first + 1)) / 2) : 0) - first;
  }
  for (let row = 0; row < result.rows; row++) {
    for (let col = 0; col < result.cols; col++) {
      const index = row * result.cols + col;
      const char = result.chars[index];
      if (!char || char === " " || char === "\t") continue;
      const alpha = (result.alpha?.[index] ?? 255) / 255;
      if (alpha === 0) continue;
      let color = style.foreground;
      const red = result.colors?.[index * 3] ?? 230, green = result.colors?.[index * 3 + 1] ?? 230, blue = result.colors?.[index * 3 + 2] ?? 230;
      if (style.colorMode === "source" && result.colors) color = `rgb(${red},${green},${blue})`;
      if (style.colorMode === "gradient") color = mix(gradientFrom, gradientTo, ((col / Math.max(1, result.cols - 1)) + (row / Math.max(1, result.rows - 1))) / 2);
      if (style.colorMode === "duotone") color = mix(dark, light, (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255);
      if (style.colorMode === "ansi") {
        let best = ANSI[0], distance = Infinity;
        for (const candidate of ANSI) {
          const next = (candidate.channels[0] - red) ** 2 + (candidate.channels[1] - green) ** 2 + (candidate.channels[2] - blue) ** 2;
          if (next < distance) { best = candidate; distance = next; }
        }
        color = best.color;
      }
      scene.glyphs.push({ text: char, x: padding + (col + offset) * cellWidth, y: padding + row * cellHeight + size * 0.82, size, color, opacity: opacity * alpha, glow: bounded(style.glow, 0, 40), shadow: bounded(style.shadow, 0, 30) });
    }
  }

  if (options.includeFrame !== false && (style.border > 0 || style.frame !== "none")) {
    const inset = Math.max(2, padding * 0.3);
    const lineWidth = Math.max(1, bounded(style.border, 0, 12));
    const rectangle: ArtworkRectangle = { x: inset, y: inset, width: Math.max(0, width - inset * 2), height: Math.max(0, height - inset * 2), color: style.foreground, lineWidth, opacity: opacity * 0.55 };
    if (style.frame === "corners") {
      const length = Math.min(32, width * 0.1, height * 0.1);
      for (const [x, y, dx, dy] of [[inset, inset, 1, 1], [width - inset, inset, -1, 1], [inset, height - inset, 1, -1], [width - inset, height - inset, -1, -1]]) {
        scene.lines.push({ x1: x, y1: y, x2: x + dx * length, y2: y, width: lineWidth, color: style.foreground, opacity });
        scene.lines.push({ x1: x, y1: y, x2: x, y2: y + dy * length, width: lineWidth, color: style.foreground, opacity });
      }
    } else {
      scene.rectangles.push(rectangle);
      if (style.frame === "double" && width > inset * 2 + 12 && height > inset * 2 + 12) scene.rectangles.push({ ...rectangle, x: inset + 5, y: inset + 5, width: rectangle.width - 10, height: rectangle.height - 10, lineWidth: 1 });
    }
  }

  if (options.includeLayers !== false) {
    for (const layer of layers) {
      if (!layer.visible) continue;
      const layerSize = bounded(layer.fontSize, 6, 120);
      const lines = layer.text.split("\n");
      for (let row = 0; row < lines.length; row++) {
        const chars = Array.from(lines[row]);
        const lineWidth = chars.length * layerSize * 0.6;
        const x = width * layer.x / 100 - (layer.alignment === "center" ? lineWidth / 2 : layer.alignment === "right" ? lineWidth : 0);
        const y = height * layer.y / 100 + row * layerSize * 1.25;
        for (let col = 0; col < chars.length; col++) {
          if (chars[col] === " ") continue;
          scene.glyphs.push({ text: chars[col], x: x + col * layerSize * 0.6, y: y + layerSize * 0.82, size: layerSize, color: layer.color, opacity: bounded(layer.opacity, 0, 1), glow: 0, shadow: 0 });
        }
      }
    }
  }
  return scene;
}

/** Raster memory is capped deliberately: callers get a useful error, never a blank oversized export. */
export function validateRasterSize(width: number, height: number, scale: number) {
  if (![width, height, scale].every(Number.isFinite) || width <= 0 || height <= 0 || scale <= 0 || width * scale > 16384 || height * scale > 16384 || width * height * scale * scale > 40_000_000) {
    throw new Error("This export is too large. Reduce export scale, font size, or ASCII resolution.");
  }
}

export function renderArtwork(canvas: HTMLCanvasElement, result: AsciiResult, style: ArtworkStyle, layers: CompositionLayer[] = [], options: ExportOptions = {}): ArtworkDimensions {
  const scene = buildArtworkScene(result, style, layers, options);
  const scale = options.scale ?? 1;
  validateRasterSize(scene.width, scene.height, scale);
  canvas.width = Math.ceil(scene.width * scale);
  canvas.height = Math.ceil(scene.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot create a canvas. Try another browser.");
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, scene.width, scene.height);
  if (scene.background) { context.fillStyle = scene.background; context.fillRect(0, 0, scene.width, scene.height); }
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  for (const rectangle of scene.rectangles) {
    context.globalAlpha = rectangle.opacity;
    context.strokeStyle = rectangle.color;
    context.lineWidth = rectangle.lineWidth;
    context.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  }
  for (const line of scene.lines) {
    context.globalAlpha = line.opacity;
    context.strokeStyle = line.color;
    context.lineWidth = line.width;
    context.beginPath(); context.moveTo(line.x1, line.y1); context.lineTo(line.x2, line.y2); context.stroke();
  }
  let font = "";
  for (const glyph of scene.glyphs) {
    const nextFont = `${glyph.size}px ${scene.fontFamily}`;
    if (font !== nextFont) { font = nextFont; context.font = font; }
    context.globalAlpha = glyph.opacity;
    context.fillStyle = glyph.color;
    context.shadowColor = glyph.glow > 0 ? glyph.color : "rgba(0,0,0,0.8)";
    context.shadowBlur = glyph.glow || glyph.shadow;
    context.shadowOffsetX = glyph.shadow * 0.4;
    context.shadowOffsetY = glyph.shadow * 0.6;
    context.fillText(glyph.text, glyph.x, glyph.y);
  }
  context.globalAlpha = 1;
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  return { width: scene.width, height: scene.height, cellWidth: scene.cellWidth, cellHeight: scene.cellHeight, padding: scene.padding };
}

const xml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);
const number = (value: number) => String(Math.round(value * 1000) / 1000);

export function artworkToSVG(result: AsciiResult, style: ArtworkStyle, layers: CompositionLayer[] = [], options: ExportOptions = {}): string {
  const scene = buildArtworkScene(result, style, layers, options);
  const scale = bounded(options.scale ?? 1, 0.25, 8);
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${number(scene.width * scale)}" height="${number(scene.height * scale)}" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="ASCII artwork">`, "<title>ASCII artwork</title>"];
  if (scene.background) parts.push(`<rect width="100%" height="100%" fill="${xml(scene.background)}"/>`);
  for (const rect of scene.rectangles) parts.push(`<rect x="${number(rect.x)}" y="${number(rect.y)}" width="${number(rect.width)}" height="${number(rect.height)}" fill="none" stroke="${xml(rect.color)}" stroke-width="${number(rect.lineWidth)}" opacity="${number(rect.opacity)}"/>`);
  for (const line of scene.lines) parts.push(`<path d="M${number(line.x1)} ${number(line.y1)}L${number(line.x2)} ${number(line.y2)}" stroke="${xml(line.color)}" stroke-width="${number(line.width)}" opacity="${number(line.opacity)}"/>`);
  const filters = new Map<string, string>();
  for (const glyph of scene.glyphs) {
    if (!glyph.glow && !glyph.shadow) continue;
    const key = `${glyph.glow}/${glyph.shadow}/${glyph.glow ? glyph.color : "black"}`;
    if (!filters.has(key)) filters.set(key, `ink${filters.size}`);
  }
  if (filters.size) {
    parts.push("<defs>");
    for (const [key, id] of filters) {
      const [glow, shadow, color] = key.split("/");
      parts.push(`<filter id="${id}" x="-150%" y="-150%" width="400%" height="400%"><feDropShadow dx="${number(Number(shadow) * 0.4)}" dy="${number(Number(shadow) * 0.6)}" stdDeviation="${number((Number(glow) || Number(shadow)) / 2)}" flood-color="${xml(color)}" flood-opacity="${Number(glow) > 0 ? "1" : "0.8"}"/></filter>`);
    }
    parts.push("</defs>");
  }
  parts.push(`<g font-family="${xml(scene.fontFamily)}" xml:space="preserve">`);
  for (const glyph of scene.glyphs) {
    const filter = filters.get(`${glyph.glow}/${glyph.shadow}/${glyph.glow ? glyph.color : "black"}`);
    parts.push(`<text x="${number(glyph.x)}" y="${number(glyph.y)}" font-size="${number(glyph.size)}" fill="${xml(glyph.color)}" opacity="${number(glyph.opacity)}"${filter ? ` filter="url(#${filter})"` : ""}>${xml(glyph.text)}</text>`);
  }
  parts.push("</g></svg>");
  return parts.join("");
}
