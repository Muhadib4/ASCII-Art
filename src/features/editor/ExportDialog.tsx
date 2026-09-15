"use client";

import { useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import Dialog from "@/components/dialog";
import { getArtworkDimensions } from "@/features/ascii";
import type { AsciiResult, ExportOptions } from "@/features/ascii/types";
import { copyASCII, exportPNG, exportSVG, exportTXT, shareArtwork } from "@/features/export";
import { audioManager } from "@/features/audio/AudioManager";
import { Color, Field, Select, Toggle } from "./controls";
import { useEditorStore } from "./store";

export default function ExportDialog({ result, onClose }: { result: AsciiResult; onClose: () => void }) {
  const { document: doc } = useEditorStore();
  const [format, setFormat] = useState<"png" | "svg" | "txt">("png");
  const [options, setOptions] = useState<ExportOptions>({ scale: 2, transparent: false, background: doc.style.background, includeFrame: true, includeLayers: true, filename: doc.name });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const size = getArtworkDimensions(result, doc.style);
  const update = (patch: Partial<ExportOptions>) => { setOptions((current) => ({ ...current, ...patch })); setStatus(""); };

  async function perform(action: "download" | "copy" | "share") {
    setBusy(true); setError(""); setStatus("");
    try {
      if (action === "copy") { await copyASCII(result); setStatus("ASCII copied. Every space in its place."); }
      else if (action === "share") {
        const outcome = await shareArtwork(result, doc.style, doc.layers, options);
        setStatus(outcome === "shared" ? "Artwork shared." : outcome === "copied" ? "Artwork copied to your clipboard." : "Your browser saved the artwork for sharing.");
      } else {
        if (format === "png") await exportPNG(result, doc.style, doc.layers, options);
        else if (format === "svg") await exportSVG(result, doc.style, doc.layers, options);
        else await exportTXT(result, options);
        setStatus(`${format.toUpperCase()} exported. Go make an impression.`);
      }
      audioManager.play("export");
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "This export could not finish. Try a smaller scale or a different format.");
      audioManager.play("error");
    } finally { setBusy(false); }
  }

  return <Dialog title="Take it with you." onClose={onClose} className="studio studio-export-dialog">
    <p className="dialog-description">Your characters, out in the world. Exported directly from this browser.</p>
    <div className="studio-export-formats">{([{ value: "png", title: "PNG", description: "Ready to share" }, { value: "svg", title: "SVG", description: "Editable vector" }, { value: "txt", title: "TXT", description: "Pure characters" }] as const).map((item) => <button key={item.value} onClick={() => { setFormat(item.value); setStatus(""); }} aria-pressed={format === item.value}><strong>.{item.title.toLowerCase()}</strong><span>{item.description}</span>{format === item.value && <Check size={14} />}</button>)}</div>
    <Field label="File name"><input aria-label="Export file name" value={options.filename} maxLength={100} onChange={(event) => update({ filename: event.target.value })} /></Field>
    {format !== "txt" ? <>
      {format === "png" && <Select label="Export scale" value={String(options.scale)} onChange={(value) => update({ scale: Number(value) })} options={[{ value: "1", label: `1× / ${size.width} × ${size.height} px` }, { value: "2", label: `2× / ${size.width * 2} × ${size.height * 2} px` }, { value: "3", label: `3× / ${size.width * 3} × ${size.height * 3} px` }]} />}
      <Toggle label="Transparent background" checked={Boolean(options.transparent)} onChange={(transparent) => update({ transparent })} />
      {!options.transparent && <Color label="Export background" value={options.background || doc.style.background} onChange={(background) => update({ background })} />}
      <Toggle label="Include frame" checked={Boolean(options.includeFrame)} onChange={(includeFrame) => update({ includeFrame })} />
      <Toggle label="Include text & decorations" checked={Boolean(options.includeLayers)} onChange={(includeLayers) => update({ includeLayers })} />
      {format === "svg" && <p className="studio-field-hint">SVG preserves colors and character positions. Font appearance depends on fonts installed in the app that opens it.</p>}
    </> : <p className="studio-export-note">TXT preserves the original character grid and whitespace. Colors, frames, and composition layers are available in PNG or SVG.</p>}
    {error && <p className="studio-inline-error" role="alert">{error}</p>}
    {status && <p className="studio-export-success" role="status"><Check size={16} />{status}</p>}
    <button className="studio-button primary full export-primary" disabled={busy} onClick={() => void perform("download")}><Download size={16} />{busy ? "[ ░▒▓ ] Preparing artwork…" : `Download ${format.toUpperCase()}`}</button>
    <div className="studio-button-row"><button className="studio-button" disabled={busy} onClick={() => void perform("copy")}><Copy size={14} /> Copy ASCII</button><button className="studio-button" disabled={busy} onClick={() => void perform("share")}><Share2 size={14} /> Share artwork</button></div>
  </Dialog>;
}
