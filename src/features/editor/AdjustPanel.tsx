"use client";

import { RotateCcw } from "lucide-react";
import { CHARACTER_RAMPS, DEFAULT_ASCII_SETTINGS } from "@/features/ascii/types";
import { Field, Range, Select, Toggle, PanelSection } from "./controls";
import { useEditorStore } from "./store";

export default function AdjustPanel() {
  const { document: doc, setAscii, setTab } = useEditorStore();
  const settings = doc.ascii;
  if (doc.mode === "text") return <div className="studio-panel-empty"><span>Aa</span><h3>Every character counts.</h3><p>Change your banner font and spacing in Source, or customize its appearance in Style.</p><button className="studio-button full" onClick={() => setTab("source")}>Edit text settings</button><button className="studio-button full" onClick={() => setTab("style")}>Style artwork</button></div>;
  return <>
    <PanelSection title="Character mapping">
      <Range label="Resolution" value={settings.width} min={32} max={200} suffix=" ch" onChange={(width) => setAscii({ width })} />
      <Range label="Aspect ratio" value={settings.aspectRatio} min={0.3} max={1} step={0.01} onChange={(aspectRatio) => setAscii({ aspectRatio })} />
      <Select label="Character set" value={Object.entries(CHARACTER_RAMPS).find(([, ramp]) => ramp === settings.ramp)?.[0] || "custom"} onChange={(value) => { if (value !== "custom") setAscii({ ramp: CHARACTER_RAMPS[value as keyof typeof CHARACTER_RAMPS] }); }} options={[...Object.keys(CHARACTER_RAMPS).map((key) => ({ value: key, label: `${key[0].toUpperCase()}${key.slice(1)}  ${CHARACTER_RAMPS[key as keyof typeof CHARACTER_RAMPS]}` })), { value: "custom", label: "Custom character set" }]} />
      <Field label="Custom ramp" hint="Dark → light. A trailing space creates open highlights."><input aria-label="Custom character ramp" value={settings.ramp} maxLength={80} spellCheck={false} onChange={(event) => setAscii({ ramp: event.target.value })} /></Field>
      <Toggle label="Invert characters" checked={settings.invert} onChange={(invert) => setAscii({ invert })} />
    </PanelSection>
    <PanelSection title="Dithering">
      <Select label="Algorithm" value={settings.dither} onChange={(dither) => setAscii({ dither })} options={[{ value: "none", label: "None / smooth mapping" }, { value: "threshold", label: "Threshold / high contrast" }, { value: "bayer", label: "Bayer / ordered texture" }, { value: "floyd-steinberg", label: "Floyd–Steinberg / fine detail" }, { value: "atkinson", label: "Atkinson / classic print" }]} />
      <Range label="Threshold" value={settings.threshold} min={0} max={255} onChange={(threshold) => setAscii({ threshold })} />
      <p className="studio-field-hint">Dithering spreads tonal detail across neighboring characters.</p>
    </PanelSection>
    <PanelSection title="Image adjustments">
      <Range label="Brightness" value={settings.brightness} min={-100} max={100} onChange={(brightness) => setAscii({ brightness })} />
      <Range label="Contrast" value={settings.contrast} min={-100} max={100} onChange={(contrast) => setAscii({ contrast })} />
      <Range label="Exposure" value={settings.exposure} min={-2} max={2} step={0.1} suffix=" EV" onChange={(exposure) => setAscii({ exposure })} />
      <Range label="Gamma" value={settings.gamma} min={0.2} max={3} step={0.05} onChange={(gamma) => setAscii({ gamma })} />
      <Range label="Saturation" value={settings.saturation} min={0} max={200} suffix="%" onChange={(saturation) => setAscii({ saturation })} />
      <Toggle label="Grayscale source" checked={settings.grayscale} onChange={(grayscale) => setAscii({ grayscale })} />
      <Range label="Sharpen" value={settings.sharpen} min={0} max={2} step={0.1} onChange={(sharpen) => setAscii({ sharpen })} />
      <Range label="Edge emphasis" value={settings.edgeEnhance} min={0} max={2} step={0.1} onChange={(edgeEnhance) => setAscii({ edgeEnhance })} />
      <Select label="Transparent pixels" value={settings.transparency} onChange={(transparency) => setAscii({ transparency })} options={[{ value: "preserve", label: "Keep transparent" }, { value: "white", label: "Flatten to white" }, { value: "black", label: "Flatten to black" }]} />
      <button className="studio-button full subtle" onClick={() => setAscii({ ...DEFAULT_ASCII_SETTINGS })}><RotateCcw size={13} /> Reset adjustments</button>
    </PanelSection>
  </>;
}
