import type { AsciiResult, TextSettings } from "./types";

/** Hand-drawn 5×7 bitmap alphabet, bundled locally so text generation works offline. */
const GLYPHS: Record<string, string> = {
  A: "01110/10001/10001/11111/10001/10001/10001", B: "11110/10001/10001/11110/10001/10001/11110",
  C: "01111/10000/10000/10000/10000/10000/01111", D: "11110/10001/10001/10001/10001/10001/11110",
  E: "11111/10000/10000/11110/10000/10000/11111", F: "11111/10000/10000/11110/10000/10000/10000",
  G: "01111/10000/10000/10111/10001/10001/01111", H: "10001/10001/10001/11111/10001/10001/10001",
  I: "11111/00100/00100/00100/00100/00100/11111", J: "00111/00010/00010/00010/10010/10010/01100",
  K: "10001/10010/10100/11000/10100/10010/10001", L: "10000/10000/10000/10000/10000/10000/11111",
  M: "10001/11011/10101/10101/10001/10001/10001", N: "10001/11001/10101/10011/10001/10001/10001",
  O: "01110/10001/10001/10001/10001/10001/01110", P: "11110/10001/10001/11110/10000/10000/10000",
  Q: "01110/10001/10001/10001/10101/10010/01101", R: "11110/10001/10001/11110/10100/10010/10001",
  S: "01111/10000/10000/01110/00001/00001/11110", T: "11111/00100/00100/00100/00100/00100/00100",
  U: "10001/10001/10001/10001/10001/10001/01110", V: "10001/10001/10001/10001/10001/01010/00100",
  W: "10001/10001/10001/10101/10101/10101/01010", X: "10001/10001/01010/00100/01010/10001/10001",
  Y: "10001/10001/01010/00100/00100/00100/00100", Z: "11111/00001/00010/00100/01000/10000/11111",
  a: "00000/00000/01110/00001/01111/10001/01111", b: "10000/10000/10110/11001/10001/10001/11110",
  c: "00000/00000/01111/10000/10000/10000/01111", d: "00001/00001/01101/10011/10001/10001/01111",
  e: "00000/00000/01110/10001/11111/10000/01111", f: "00110/01001/01000/11100/01000/01000/01000",
  g: "00000/01111/10001/10001/01111/00001/01110", h: "10000/10000/10110/11001/10001/10001/10001",
  i: "00100/00000/01100/00100/00100/00100/01110", j: "00010/00000/00110/00010/00010/10010/01100",
  k: "10000/10000/10010/10100/11000/10100/10010", l: "01100/00100/00100/00100/00100/00100/01110",
  m: "00000/00000/11010/10101/10101/10101/10101", n: "00000/00000/10110/11001/10001/10001/10001",
  o: "00000/00000/01110/10001/10001/10001/01110", p: "00000/00000/11110/10001/11110/10000/10000",
  q: "00000/00000/01111/10001/01111/00001/00001", r: "00000/00000/10111/11000/10000/10000/10000",
  s: "00000/00000/01111/10000/01110/00001/11110", t: "01000/01000/11100/01000/01000/01001/00110",
  u: "00000/00000/10001/10001/10001/10011/01101", v: "00000/00000/10001/10001/10001/01010/00100",
  w: "00000/00000/10001/10001/10101/10101/01010", x: "00000/00000/10001/01010/00100/01010/10001",
  y: "00000/00000/10001/10001/01111/00001/01110", z: "00000/00000/11111/00010/00100/01000/11111",
  "0": "01110/10001/10011/10101/11001/10001/01110", "1": "00100/01100/00100/00100/00100/00100/01110",
  "2": "01110/10001/00001/00010/00100/01000/11111", "3": "11110/00001/00001/01110/00001/00001/11110",
  "4": "00010/00110/01010/10010/11111/00010/00010", "5": "11111/10000/10000/11110/00001/00001/11110",
  "6": "01110/10000/10000/11110/10001/10001/01110", "7": "11111/00001/00010/00100/01000/01000/01000",
  "8": "01110/10001/10001/01110/10001/10001/01110", "9": "01110/10001/10001/01111/00001/00001/01110",
  " ": "000/000/000/000/000/000/000", ".": "000/000/000/000/000/010/010", ",": "000/000/000/000/010/010/100",
  "!": "010/010/010/010/010/000/010", "?": "01110/10001/00001/00010/00100/00000/00100",
  "-": "00000/00000/00000/11111/00000/00000/00000", "_": "00000/00000/00000/00000/00000/00000/11111",
  ":": "000/010/010/000/010/010/000", ";": "000/010/010/000/010/010/100",
  "+": "00000/00100/00100/11111/00100/00100/00000", "=": "00000/00000/11111/00000/11111/00000/00000",
  "/": "00001/00001/00010/00100/01000/10000/10000", "\\": "10000/10000/01000/00100/00010/00001/00001",
  "(": "001/010/100/100/100/010/001", ")": "100/010/001/001/001/010/100",
  "[": "111/100/100/100/100/100/111", "]": "111/001/001/001/001/001/111",
  "#": "01010/01010/11111/01010/11111/01010/01010", "@": "01110/10001/10111/10101/10111/10000/01111",
  "&": "01100/10010/10100/01000/10101/10010/01101", "*": "00000/10101/01110/11111/01110/10101/00000",
  "'": "010/010/100/000/000/000/000", '"': "101/101/101/000/000/000/000",
  "<": "00010/00100/01000/10000/01000/00100/00010", ">": "01000/00100/00010/00001/00010/00100/01000",
};

export const TEXT_FONTS = [
  { id: "block", name: "Monument" }, { id: "outline", name: "Wireframe" },
  { id: "slant", name: "Velocity" }, { id: "dots", name: "Dot Matrix" },
  { id: "compact", name: "Plain Mono" },
] as const;

export function generateTextArt(input: string, settings: TextSettings): AsciiResult {
  const text = (settings.case === "upper" ? input.toUpperCase() : settings.case === "lower" ? input.toLowerCase() : input).slice(0, 1000);
  const width = Math.max(12, Math.min(320, Math.round(settings.width)));
  const scale = Math.max(1, Math.min(3, Math.round(settings.scale)));
  const spacing = Math.max(0, Math.min(8, Math.round(settings.letterSpacing)));
  const lineGap = Math.max(0, Math.min(8, Math.round(settings.lineSpacing)));
  let lines: string[] = [];

  if (settings.font === "compact") {
    for (const paragraph of text.split("\n")) {
      const chars = Array.from(paragraph).join(" ".repeat(spacing));
      const chunks = chars.match(new RegExp(`.{1,${width}}`, "gu")) ?? [""];
      lines.push(...chunks, ...Array<string>(lineGap).fill(""));
    }
    if (lineGap) lines = lines.slice(0, -lineGap);
  } else {
    const ink = settings.font === "dots" ? (settings.density === "█" ? "●" : Array.from(settings.density)[0] || "●") : Array.from(settings.density)[0] || "█";
    const maxLogical = Math.max(7, Math.floor(width / scale) - (settings.font === "slant" ? 3 : 0));
    for (const paragraph of text.split("\n")) {
      const groups: string[][] = [[]];
      let groupWidth = 0;
      for (const char of Array.from(paragraph)) {
        const glyph = (GLYPHS[char] ?? GLYPHS[char.normalize("NFD").replace(/[\u0300-\u036f]/g, "")] ?? "11111/10001/10101/10101/10101/10001/11111").split("/");
        const nextWidth = glyph[0].length + (groupWidth ? spacing : 0);
        if (groupWidth && groupWidth + nextWidth > maxLogical) { groups.push([]); groupWidth = 0; }
        groups[groups.length - 1].push(glyph.join("/"));
        groupWidth += glyph[0].length + (groupWidth ? spacing : 0);
      }
      for (const group of groups) {
        const glyphs = group.map(glyph => glyph.split("/"));
        for (let y = 0; y < 7; y++) {
          const row = glyphs.map(glyph => Array.from(glyph[y]).map((pixel, x) => {
            if (pixel !== "1") return " ";
            if (settings.font === "outline" && glyph[y - 1]?.[x] === "1" && glyph[y + 1]?.[x] === "1" && glyph[y][x - 1] === "1" && glyph[y][x + 1] === "1") return " ";
            return ink;
          }).join("")).join(" ".repeat(spacing));
          const slanted = (settings.font === "slant" ? " ".repeat(Math.floor((6 - y) / 2)) : "") + row;
          const scaled = Array.from(slanted).map(char => char.repeat(scale)).join("");
          lines.push(...Array<string>(scale).fill(scaled));
        }
        lines.push(...Array<string>(lineGap).fill(""));
      }
    }
    if (lineGap) lines = lines.slice(0, -lineGap);
  }
  if (!lines.length) lines = [""];
  const cols = Math.max(1, ...lines.map(line => Array.from(line).length));
  lines = lines.map(line => {
    const remaining = cols - Array.from(line).length;
    const before = settings.alignment === "center" ? Math.floor(remaining / 2) : settings.alignment === "right" ? remaining : 0;
    return " ".repeat(before) + line + " ".repeat(remaining - before);
  });
  return { cols, rows: lines.length, text: lines.join("\n"), chars: lines.flatMap(line => Array.from(line)) };
}
