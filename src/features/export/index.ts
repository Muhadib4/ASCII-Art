import { artworkToSVG, renderArtwork } from "../ascii/renderer";
import type { ArtworkStyle, AsciiResult, CompositionLayer, ExportOptions } from "../ascii/types";

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari may start reading the blob after the click event returns.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filename(options: ExportOptions, extension: string): string {
  const stem = (options.filename || "ascii-artwork").replace(/\.(png|svg|txt)$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").slice(0, 120).trim();
  return `${stem || "ascii-artwork"}.${extension}`;
}

export async function createPNG(result: AsciiResult, style: ArtworkStyle, layers: CompositionLayer[] = [], options: ExportOptions = {}): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  renderArtwork(canvas, result, style, layers, options);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      canvas.width = 1; canvas.height = 1;
      if (blob) resolve(blob);
      else reject(new Error("PNG export failed. Try a smaller export scale."));
    }, "image/png");
  });
}

export async function exportPNG(result: AsciiResult, style: ArtworkStyle, layers: CompositionLayer[] = [], options: ExportOptions = {}): Promise<void> {
  downloadBlob(await createPNG(result, style, layers, options), filename(options, "png"));
}

export function exportSVG(result: AsciiResult, style: ArtworkStyle, layers: CompositionLayer[] = [], options: ExportOptions = {}): void {
  downloadBlob(new Blob([artworkToSVG(result, style, layers, options)], { type: "image/svg+xml;charset=utf-8" }), filename(options, "svg"));
}

export function exportTXT(result: AsciiResult, options: ExportOptions = {}): void {
  downloadBlob(new Blob([result.text], { type: "text/plain;charset=utf-8" }), filename(options, "txt"));
}

export async function copyASCII(result: AsciiResult): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(result.text);
      return;
    }
    const field = document.createElement("textarea");
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    field.value = result.text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    previouslyFocused?.focus();
    if (!copied) throw new Error("Clipboard unavailable");
  } catch {
    throw new Error("Clipboard access was blocked. Download a TXT file or allow clipboard access in your browser.");
  }
}

export async function shareArtwork(result: AsciiResult, style: ArtworkStyle, layers: CompositionLayer[] = [], options: ExportOptions = {}): Promise<"shared" | "copied" | "downloaded"> {
  const blob = await createPNG(result, style, layers, options);
  const file = new File([blob], filename(options, "png"), { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: options.filename || "ASCII artwork" }); return "shared"; }
    catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw new Error("Sharing cancelled.");
      // Browsers can deny a delayed share gesture; continue to a local copy/download.
    }
  }
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); return "copied"; }
    catch { /* Clipboard image support varies; download is the dependable local fallback. */ }
  }
  downloadBlob(blob, filename(options, "png"));
  return "downloaded";
}
