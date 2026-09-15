"use client";

import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Layers, Plus, Trash2 } from "lucide-react";
import type { CompositionLayer } from "@/features/ascii/types";
import { Color, Field, PanelSection, Range, Select } from "./controls";
import { useEditorStore } from "./store";

const layerTypes: { type: CompositionLayer["type"]; label: string; glyph: string }[] = [
  { type: "title", label: "Title", glyph: "T" }, { type: "subtitle", label: "Subtitle", glyph: "t" },
  { type: "text", label: "Caption", glyph: "¶" }, { type: "badge", label: "Badge", glyph: "[]" },
  { type: "coordinates", label: "Coordinates", glyph: "+" }, { type: "frame", label: "Decoration", glyph: "─" },
];

export default function CompositionPanel() {
  const { document: doc, selectedLayer, selectLayer, addLayer, updateLayer, deleteLayer, duplicateLayer, reorderLayer } = useEditorStore();
  const selected = doc.layers.find((layer) => layer.id === selectedLayer);
  return <>
    <PanelSection title="Build a composition">
      <p className="studio-field-hint">Give your characters context. Add a layer, then drag it directly on the canvas.</p>
      <div className="studio-layer-add">{layerTypes.map(({ type, label, glyph }) => <button key={type} onClick={() => addLayer(type)}><span>{glyph}</span>{label}<Plus size={12} /></button>)}</div>
      <button className="studio-button full subtle" onClick={() => { addLayer("text"); const state = useEditorStore.getState(); if (state.selectedLayer) state.updateLayer(state.selectedLayer, { text: new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date()) }); }}>+ Add today&apos;s date</button>
    </PanelSection>
    <PanelSection title={`Layers / ${doc.layers.length + 1}`}>
      <div className="studio-layer-list">{[...doc.layers].reverse().map((layer) => <div key={layer.id} className={`studio-layer-row ${selectedLayer === layer.id ? "selected" : ""}`}>
        <button className="studio-layer-select" onClick={() => selectLayer(layer.id)} aria-pressed={selectedLayer === layer.id}><span>{layerTypes.find((item) => item.type === layer.type)?.glyph}</span><span><strong>{layer.text.split("\n")[0] || "Empty text"}</strong><small>{layer.type}</small></span></button>
        <button className="studio-icon-button" title={layer.visible ? "Hide layer" : "Show layer"} aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.type} layer`} onClick={() => updateLayer(layer.id, { visible: !layer.visible })}>{layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
      </div>)}<div className="studio-layer-base"><Layers size={15} /><span>ASCII artwork<small>Base · edit in Source & Style</small></span></div></div>
    </PanelSection>
    {selected ? <PanelSection title="Selected layer">
      <Field label="Layer content"><textarea aria-label="Layer content" rows={3} maxLength={500} value={selected.text} onChange={(event) => updateLayer(selected.id, { text: event.target.value })} /></Field>
      <Range label="Horizontal position" value={selected.x} min={0} max={100} step={0.5} suffix="%" onChange={(x) => updateLayer(selected.id, { x })} />
      <Range label="Vertical position" value={selected.y} min={0} max={100} step={0.5} suffix="%" onChange={(y) => updateLayer(selected.id, { y })} />
      <Range label="Type size" value={selected.fontSize} min={6} max={100} suffix=" px" onChange={(fontSize) => updateLayer(selected.id, { fontSize })} />
      <Range label="Opacity" value={selected.opacity} min={0} max={1} step={0.01} onChange={(opacity) => updateLayer(selected.id, { opacity })} />
      <Color label="Layer color" value={selected.color} onChange={(color) => updateLayer(selected.id, { color })} />
      <Select label="Alignment" value={selected.alignment} onChange={(alignment) => updateLayer(selected.id, { alignment })} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]} />
      <div className="studio-button-row"><button className="studio-button" disabled={doc.layers.at(-1)?.id === selected.id} onClick={() => reorderLayer(selected.id, 1)}><ArrowUp size={14} /> Forward</button><button className="studio-button" disabled={doc.layers[0]?.id === selected.id} onClick={() => reorderLayer(selected.id, -1)}><ArrowDown size={14} /> Back</button></div>
      <div className="studio-button-row"><button className="studio-button" onClick={() => duplicateLayer(selected.id)}><Copy size={14} /> Duplicate</button><button className="studio-button danger" onClick={() => deleteLayer(selected.id)}><Trash2 size={14} /> Delete</button></div>
      <p className="studio-field-hint">Tip: use arrow keys on a selected canvas layer to move it. Hold Shift for larger steps.</p>
    </PanelSection> : <div className="studio-panel-empty compact"><span>[ + ]</span><p>Select a layer to change its position, type, and color.</p></div>}
  </>;
}
