"use client";

import { ArrowLeftRight, RotateCcw } from "lucide-react";
import { DEFAULT_ARTWORK_STYLE } from "@/features/ascii/types";
import { Color, PanelSection, Range, Select } from "./controls";
import { useEditorStore } from "./store";

export default function StylePanel() {
  const { document: doc, setStyle } = useEditorStore();
  const style = doc.style;
  return <>
    <PanelSection title="Color & atmosphere">
      <Select label="Color mode" value={style.colorMode} onChange={(colorMode) => setStyle({ colorMode })} options={[{ value: "monochrome", label: "Monochrome / one color" }, { value: "source", label: "Source / original colors" }, { value: "duotone", label: "Duotone / two tones" }, { value: "gradient", label: "Gradient / across artwork" }, { value: "ansi", label: "ANSI / terminal palette" }]} />
      <Color label="Foreground" value={style.foreground} onChange={(foreground) => setStyle({ foreground })} />
      <Color label="Background" value={style.background} onChange={(background) => setStyle({ background })} />
      <button className="studio-button full subtle" onClick={() => setStyle({ foreground: style.background, background: style.foreground })}><ArrowLeftRight size={13} /> Swap foreground & background</button>
      {style.colorMode === "gradient" && <><Color label="Gradient start" value={style.gradientFrom} onChange={(gradientFrom) => setStyle({ gradientFrom })} /><Color label="Gradient end" value={style.gradientTo} onChange={(gradientTo) => setStyle({ gradientTo })} /></>}
      {style.colorMode === "duotone" && <><Color label="Shadow tone" value={style.duotoneDark} onChange={(duotoneDark) => setStyle({ duotoneDark })} /><Color label="Highlight tone" value={style.duotoneLight} onChange={(duotoneLight) => setStyle({ duotoneLight })} /></>}
      <Range label="Artwork opacity" value={style.opacity} min={0} max={1} step={0.01} onChange={(opacity) => setStyle({ opacity })} />
      <Range label="Glow" value={style.glow} min={0} max={15} suffix=" px" onChange={(glow) => setStyle({ glow })} />
      <Range label="Shadow" value={style.shadow} min={0} max={20} suffix=" px" onChange={(shadow) => setStyle({ shadow })} />
    </PanelSection>
    <PanelSection title="Typography">
      <Select label="Monospace font" value={style.fontFamily} onChange={(fontFamily) => setStyle({ fontFamily })} options={[{ value: '"Courier New", monospace', label: "Courier / classic typewriter" }, { value: 'Consolas, "Liberation Mono", monospace', label: "Consolas / precise terminal" }, { value: '"Lucida Console", Monaco, monospace', label: "Lucida / compact console" }, { value: 'monospace', label: "System / native monospace" }]} />
      <Range label="Font size" value={style.fontSize} min={6} max={24} suffix=" px" onChange={(fontSize) => setStyle({ fontSize })} />
      <Range label="Character spacing" value={style.letterSpacing} min={-2} max={5} step={0.1} suffix=" px" onChange={(letterSpacing) => setStyle({ letterSpacing })} />
      <Range label="Line height" value={style.lineHeight} min={0.8} max={2} step={0.02} onChange={(lineHeight) => setStyle({ lineHeight })} />
      <Select label="Artwork alignment" value={style.alignment} onChange={(alignment) => setStyle({ alignment })} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
      <p className="studio-field-hint">Monospaced rendering keeps every character on a stable grid. Fonts use the closest available system face.</p>
    </PanelSection>
    <PanelSection title="Frame & spacing">
      <Select label="Frame" value={style.frame} onChange={(frame) => setStyle({ frame })} options={[{ value: "none", label: "None / clean edge" }, { value: "line", label: "Single line" }, { value: "corners", label: "Corner registration marks" }, { value: "double", label: "Double / terminal frame" }]} />
      <Range label="Border weight" value={style.border} min={0} max={8} suffix=" px" onChange={(border) => setStyle({ border })} />
      <Range label="Padding" value={style.padding} min={0} max={180} suffix=" px" onChange={(padding) => setStyle({ padding })} />
      <button className="studio-button full subtle" onClick={() => setStyle({ ...DEFAULT_ARTWORK_STYLE })}><RotateCcw size={13} /> Reset style</button>
    </PanelSection>
  </>;
}
