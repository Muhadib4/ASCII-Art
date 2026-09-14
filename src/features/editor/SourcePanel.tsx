"use client";

import { ImagePlus, Upload, WandSparkles } from "lucide-react";
import { createSampleImage } from "@/features/ascii";
import { presets, getPresetSettings, rememberPreset } from "@/features/presets/presets";
import { Field, Range, Select, PanelSection } from "./controls";
import { useEditorStore } from "./store";
import CameraCapture from "./CameraCapture";

export default function SourcePanel({ onUpload }: { onUpload: () => void }) {
  const { document: doc, edit, setTextSettings } = useEditorStore();
  return <>
    <PanelSection title={doc.mode === "text" ? "Your words" : doc.mode === "photo" ? "Camera input" : "Source material"}>
      {doc.mode === "text" ? <>
        <Field label="Text content" hint={`${doc.text.length}/240 characters · line breaks supported`}><textarea aria-label="Text content" className="studio-text-input" value={doc.text} maxLength={240} rows={4} spellCheck={false} onChange={(event) => edit({ text: event.target.value })} placeholder="Say something." /></Field>
        <Select label="Banner style" value={doc.textSettings.font} onChange={(font) => setTextSettings({ font })} options={[{ value: "block", label: "01 / Solid block" }, { value: "outline", label: "02 / Outline" }, { value: "slant", label: "03 / Slanted" }, { value: "dots", label: "04 / Dot matrix" }, { value: "compact", label: "05 / Compact" }]} />
        <Select label="Letter case" value={doc.textSettings.case} onChange={(value) => setTextSettings({ case: value })} options={[{ value: "upper", label: "UPPERCASE" }, { value: "lower", label: "lowercase" }, { value: "original", label: "As typed" }]} />
        <Field label="Drawing character"><input type="text" maxLength={2} aria-label="Drawing character" value={doc.textSettings.density} onChange={(event) => setTextSettings({ density: event.target.value || "█" })} /></Field>
        <Range label="Letter spacing" value={doc.textSettings.letterSpacing} min={0} max={6} onChange={(letterSpacing) => setTextSettings({ letterSpacing })} />
        <Range label="Line spacing" value={doc.textSettings.lineSpacing} min={0} max={8} onChange={(lineSpacing) => setTextSettings({ lineSpacing })} />
        <Range label="Banner width" value={doc.textSettings.width} min={40} max={240} suffix=" ch" onChange={(width) => setTextSettings({ width })} />
        <Range label="Character scale" value={doc.textSettings.scale} min={1} max={3} onChange={(scale) => setTextSettings({ scale })} />
        <Select label="Text alignment" value={doc.textSettings.alignment} onChange={(alignment) => setTextSettings({ alignment })} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
        <div className="studio-text-presets"><span className="studio-field-label">Quick starts</span>{[{ text: "HELLO\nWORLD", font: "block" as const, density: "█", letterSpacing: 1 }, { text: "MAKE\nSOMETHING", font: "outline" as const, density: "#", letterSpacing: 2 }, { text: "stay curious", font: "dots" as const, density: "●", letterSpacing: 1 }].map((preset) => <button key={preset.text} onClick={() => edit({ text: preset.text, textSettings: { ...doc.textSettings, font: preset.font, density: preset.density, letterSpacing: preset.letterSpacing } })}>{preset.text.replace("\n", " / ")}</button>)}</div>
      </> : <>
        {doc.mode === "photo" && <CameraCapture onCapture={(source) => edit({ source, sourceName: "Camera capture" })} />}
        <button className="studio-upload-zone" onClick={onUpload}><span className="studio-upload-icon"><ImagePlus size={24} strokeWidth={1.4} /></span><strong>{doc.sourceName || "Add an image"}</strong><span>Drop an image or <u>browse files</u></span><small>JPG, PNG, WEBP, GIF · up to 30 MB</small></button>
        <p className="studio-privacy">Processed here. Never uploaded.</p>
        <div className="studio-sample-label">OR TRY A SAMPLE</div><div className="studio-samples">{(["bust", "sphere", "mountains"] as const).map((sample, index) => <button key={sample} aria-label={`Load ${sample} sample`} onClick={() => edit({ source: createSampleImage(sample), sourceName: sample === "bust" ? "Classical study" : sample === "sphere" ? "Orbital study" : "Mountain study" })}><span>{["(@)", "◒", "/\\"][index]}</span>{["Sculpture", "Sphere", "Landscape"][index]}</button>)}</div>
        <button className="studio-button full subtle" onClick={onUpload}><Upload size={14} /> Replace source</button>
      </>}
    </PanelSection>
    <PanelSection title="Starting points">
      <div className="studio-preset-list">{presets.map((preset) => <button key={preset.id} onClick={() => { const settings = getPresetSettings(preset.id); if (settings) { edit(settings); rememberPreset(preset.id); } }}><span className="studio-preset-glyph" style={{ color: preset.style.foreground || preset.style.gradientFrom, background: preset.style.background }}>{preset.glyph}</span><span><strong>{preset.name}</strong><small>{preset.category}</small></span><WandSparkles size={13} /></button>)}</div>
    </PanelSection>
  </>;
}
