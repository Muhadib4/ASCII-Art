"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Check, ChevronDown, Copy, Download, Image, Keyboard, Layers, LayoutTemplate, Palette, Redo2, SlidersHorizontal, Trash2, Type, Undo2, Upload, X } from "lucide-react";
import SiteHeader from "@/components/site-header";
import Dialog from "@/components/dialog";
import { createSampleImage, loadImageFile, useAsciiProcessor } from "@/features/ascii";
import { audioManager } from "@/features/audio/AudioManager";
import { copyASCII } from "@/features/export";
import { getPresetSettings, rememberPreset } from "@/features/presets/presets";
import AdjustPanel from "./AdjustPanel";
import CanvasPreview from "./CanvasPreview";
import CompositionPanel from "./CompositionPanel";
import ExportDialog from "./ExportDialog";
import SourcePanel from "./SourcePanel";
import StylePanel from "./StylePanel";
import { persistPreferences, restorePreferences, useEditorStore, type CreationMode, type InspectorTab } from "./store";
import "./editor.css";

const modes = [
  { id: "text", label: "Text", title: "Text Lab", icon: Type, number: "01" },
  { id: "image", label: "Image", title: "Image Lab", icon: Image, number: "02" },
  { id: "photo", label: "Photo", title: "Photo Lab", icon: Camera, number: "03" },
  { id: "design", label: "Design", title: "Design Lab", icon: LayoutTemplate, number: "04" },
] as const;
const tabs = [
  { id: "source", label: "Source", icon: Image },
  { id: "adjust", label: "Adjust", icon: SlidersHorizontal },
  { id: "style", label: "Style", icon: Palette },
  { id: "layers", label: "Layers", icon: Layers },
] as const;
const mobileQuery = "(max-width: 760px)";
function subscribeMobile(callback: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;

function InspectorTabs({ active, onChange }: { active: InspectorTab; onChange: (tab: InspectorTab) => void }) {
  return <div className="studio-inspector-tabs" role="tablist" aria-label="Artwork controls">{tabs.map((item) => <button key={item.id} role="tab" id={`studio-tab-${item.id}`} aria-selected={active === item.id} aria-controls="studio-inspector-panel" tabIndex={active === item.id ? 0 : -1} onKeyDown={(event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === active);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    document.getElementById(`studio-tab-${tabs[next].id}`)?.focus();
  }} onClick={() => onChange(item.id)}><item.icon size={15} /><span>{item.label}</span></button>)}</div>;
}

export default function Editor() {
  const { document: doc, past, future, tab, selectedLayer, edit, setTab, undo, redo, deleteLayer, duplicateLayer } = useEditorStore();
  const query = useSearchParams();
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverSnapshot);
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadGeneration = useRef(0);
  const initialQuery = useRef<string | null>(null);
  const dragDepth = useRef(0);
  const wasProcessing = useRef(false);
  const [mobileInspector, setMobileInspector] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const { result, processing, error } = useAsciiProcessor(doc.mode === "text" ? null : doc.source, doc.ascii, doc.mode === "text" && doc.text.trim() ? doc.text : doc.mode === "text" ? "" : null, doc.textSettings);
  const artwork = doc.mode === "text" && !doc.text.trim() ? null : result;
  const currentMode = modes.find((item) => item.id === doc.mode) ?? modes[1];

  const notify = useCallback((message: string, isError = false) => {
    setToast({ message, error: isError });
    if (isError) audioManager.play("error");
  }, []);
  const reportError = useCallback((message: string) => notify(message, true), [notify]);

  useEffect(() => {
    const search = query.toString();
    if (initialQuery.current === search) return;
    const first = initialQuery.current === null;
    initialQuery.current = search;
    const requestedMode = query.get("mode");
    const mode = modes.find((item) => item.id === requestedMode)?.id;
    const presetId = query.get("preset");
    const preset = presetId ? getPresetSettings(presetId) : null;
    const state = useEditorStore.getState();
    state.edit({
      ...(first ? restorePreferences() : {}),
      ...(preset ?? {}),
      ...(mode ? { mode } : {}),
      ...(first && !state.document.source ? { source: createSampleImage("bust"), sourceName: "Classical study" } : {}),
    }, false);
    if (presetId && preset) rememberPreset(presetId);
    if (mode === "design" && !state.document.layers.length) {
      state.addLayer("title"); state.addLayer("subtitle");
      useEditorStore.setState({ past: [], future: [], selectedLayer: null, tab: "layers" });
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => persistPreferences(doc), 400);
    return () => window.clearTimeout(timer);
  }, [doc]);

  useEffect(() => {
    if (!toast || toast.error) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (wasProcessing.current && !processing && result && !error) audioManager.play("processing-complete");
    wasProcessing.current = processing;
  }, [processing, result, error]);

  const openUpload = useCallback(() => uploadRef.current?.click(), []);
  const copy = useCallback(async () => {
    if (!artwork) return;
    try { await copyASCII(artwork); notify("ASCII copied. Every space in its place."); audioManager.play("confirm"); }
    catch (reason) { reportError(reason instanceof Error ? reason.message : "Clipboard access was denied. Try downloading a TXT file instead."); }
  }, [artwork, notify, reportError]);

  function changeMode(mode: CreationMode) {
    edit({ mode }); setTab(mode === "design" ? "layers" : "source");
    audioManager.play("switch");
    if (mobile) setMobileInspector(true);
  }

  const clear = useCallback(() => {
    uploadGeneration.current++;
    edit({ source: null, sourceName: "", text: "", layers: [] });
    useEditorStore.getState().selectLayer(null);
    notify("Canvas cleared. Undo brings it back.");
  }, [edit, notify]);

  async function upload(file: File) {
    const generation = ++uploadGeneration.current;
    setUploading(true);
    try {
      const source = await loadImageFile(file);
      if (generation !== uploadGeneration.current) return;
      const state = useEditorStore.getState();
      state.edit({ source, sourceName: file.name, mode: state.document.mode === "text" ? "image" : state.document.mode });
      setTab("adjust"); setMobileInspector(false);
      audioManager.play("upload"); notify(`${file.name} is ready to explore.`);
    } catch (reason) {
      if (generation === uploadGeneration.current) reportError(reason instanceof Error ? reason.message : "This image could not be opened.");
    } finally { if (generation === uploadGeneration.current) setUploading(false); }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true], dialog")) return;
      const command = event.ctrlKey || event.metaKey;
      if (command && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      else if (command && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
      else if (command && event.key.toLowerCase() === "c" && artwork) { event.preventDefault(); void copy(); }
      else if (command && event.key.toLowerCase() === "d" && selectedLayer) { event.preventDefault(); duplicateLayer(selectedLayer); }
      else if (command && event.key.toLowerCase() === "o") { event.preventDefault(); openUpload(); }
      else if (command && event.key.toLowerCase() === "e" && artwork) { event.preventDefault(); setExportOpen(true); }
      else if ((event.key === "Delete" || event.key === "Backspace") && selectedLayer) { event.preventDefault(); deleteLayer(selectedLayer); }
      else if (event.key === "?") { event.preventDefault(); setShortcutsOpen(true); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [artwork, copy, deleteLayer, duplicateLayer, openUpload, redo, selectedLayer, undo]);

  const inspector = <>
    <InspectorTabs active={tab} onChange={setTab} />
    <div className="studio-inspector-content" id="studio-inspector-panel" role="tabpanel" aria-labelledby={`studio-tab-${tab}`}>
      {tab === "source" && <SourcePanel onUpload={openUpload} />}
      {tab === "adjust" && <AdjustPanel />}
      {tab === "style" && <StylePanel />}
      {tab === "layers" && <CompositionPanel />}
    </div>
    <div className="studio-inspector-footer"><span>YOUR DEVICE. YOUR WORK.</span><span>↗ LOCAL</span></div>
  </>;

  return <div className="studio studio-shell">
    <SiteHeader active="studio" />
    <main id="main" className="studio-main" onDragEnter={(event) => { if (!event.dataTransfer.types.includes("Files")) return; event.preventDefault(); dragDepth.current++; setDragOver(true); }} onDragLeave={(event) => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragOver(false); }} onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }} onDrop={(event) => { event.preventDefault(); dragDepth.current = 0; setDragOver(false); const file = event.dataTransfer.files[0]; if (file) void upload(file); }}>
      <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="studio-sr-only" tabIndex={-1} aria-label="Upload source image" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
      <div className="studio-document-bar">
        <div className="studio-document-name"><span className="studio-document-mark" aria-hidden="true">[*]</span><label className="studio-sr-only" htmlFor="artwork-name">Artwork name</label><input id="artwork-name" value={doc.name} maxLength={80} onChange={(event) => edit({ name: event.target.value }, false)} onBlur={() => { if (!doc.name.trim()) edit({ name: "Untitled exploration" }, false); }} /><span className="studio-session-label">LOCAL SESSION</span></div>
        <div className="studio-document-actions"><div className="studio-history"><button className="studio-icon-button" aria-label="Undo" title="Undo (Ctrl / ⌘ Z)" disabled={!past.length} onClick={undo}><Undo2 size={16} /></button><button className="studio-icon-button" aria-label="Redo" title="Redo (Ctrl / ⌘ Shift Z)" disabled={!future.length} onClick={redo}><Redo2 size={16} /></button></div><button className="studio-button studio-copy-action" disabled={!artwork || processing} onClick={() => void copy()}><Copy size={14} />Copy ASCII</button><button className="studio-button primary" disabled={!artwork || processing || uploading} onClick={() => setExportOpen(true)}><Download size={15} /><span>Export</span><span className="studio-export-arrow">↗</span></button></div>
      </div>
      <div className="studio-workspace">
        <nav className="studio-mode-rail" aria-label="Creation mode"><span className="studio-rail-caption">CREATE</span>{modes.map((item) => <button key={item.id} title={item.title} onClick={() => changeMode(item.id)} aria-pressed={doc.mode === item.id}><span className="studio-mode-number">/{item.number}</span><item.icon size={21} strokeWidth={1.5} /><span>{item.label}</span></button>)}<div className="studio-rail-spacer" /><button className="studio-help-action" onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts"><Keyboard size={19} /><span>Keys</span></button><span className="studio-rail-bottom" aria-hidden="true">+<br />+<br />+</span></nav>
        <section className="studio-canvas-column" aria-label="Artwork workspace"><div className="studio-workspace-heading"><div><span className="studio-lab-number">/{currentMode.number}</span><h1>{currentMode.title}</h1><span className="studio-lab-description">{doc.mode === "text" ? "Give your words a little character." : doc.mode === "design" ? "Compose something worth keeping." : doc.mode === "photo" ? "A new way to see yourself." : "An image. A thousand characters."}</span></div><div className="studio-workspace-utilities">{selectedLayer && <button className="studio-icon-button" title="Duplicate selected layer" aria-label="Duplicate selected layer" onClick={() => duplicateLayer(selectedLayer)}><Copy size={14} /></button>}<button className="studio-icon-button" title="Upload an image" aria-label="Upload an image" onClick={openUpload}><Upload size={15} /></button><button className="studio-icon-button" title="Clear canvas (undoable)" aria-label="Clear canvas" disabled={!artwork && !doc.layers.length} onClick={clear}><Trash2 size={15} /></button></div></div>
          <div className="studio-mobile-mode"><label htmlFor="creation-mode">CREATION MODE</label><div><select id="creation-mode" value={doc.mode} onChange={(event) => changeMode(event.target.value as CreationMode)}>{modes.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><ChevronDown size={14} /></div></div>
          <CanvasPreview result={artwork} processing={processing || uploading} onError={reportError} />
          <div className="studio-statusbar"><span><span className={`studio-live-dot ${processing || uploading ? "working" : ""}`} />{uploading ? "READING IMAGE…" : processing ? "MAPPING CHARACTERS…" : artwork ? "ALL CHANGES RENDERED" : "READY WHEN YOU ARE"}</span><span>{artwork ? `${(artwork.cols * artwork.rows).toLocaleString("en")} CELLS` : "100% LOCAL"}<span className="studio-status-divider">/</span>{doc.layers.length} LAYERS</span></div>
        </section>
        {!mobile && <aside className="studio-inspector" aria-label="Artwork inspector"><div className="studio-inspector-heading"><span>THE DETAILS</span><span>⌘</span></div>{inspector}</aside>}
      </div>
      {mobile && <nav className="studio-mobile-dock" aria-label="Open artwork controls">{tabs.map((item) => <button key={item.id} aria-label={`Open ${item.label.toLowerCase()} controls`} aria-expanded={mobileInspector && tab === item.id} onClick={() => { setTab(item.id); setMobileInspector(true); }}><item.icon size={20} strokeWidth={1.5} /><span>{item.label}</span></button>)}</nav>}
      {dragOver && <div className="studio-drop-overlay"><Upload size={38} /><strong>Drop it. Make it ASCII.</strong><span>YOUR IMAGE NEVER LEAVES THIS DEVICE.</span></div>}
    </main>
    {(toast || error) && <div className={`studio-toast ${(toast?.error || error) ? "is-error" : ""}`} role={(toast?.error || error) ? "alert" : "status"}>{(toast?.error || error) ? <span aria-hidden="true">[!]</span> : <Check size={16} />}<span>{error || toast?.message}</span>{!error && <button className="studio-icon-button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={14} /></button>}</div>}
    {mobile && mobileInspector && <Dialog title={currentMode.title} onClose={() => setMobileInspector(false)} className="studio studio-inspector-sheet">{inspector}<button className="studio-button primary full" onClick={() => setMobileInspector(false)}>Back to canvas <Check size={15} /></button></Dialog>}
    {exportOpen && artwork && <ExportDialog result={artwork} onClose={() => setExportOpen(false)} />}
    {shortcutsOpen && <Dialog title="A few good shortcuts." className="studio studio-shortcuts-dialog" onClose={() => setShortcutsOpen(false)}><p className="dialog-description">More creating. Less clicking. Use ⌘ on Mac or Ctrl on Windows.</p><dl className="studio-shortcuts">{[["Undo", "⌘ / Ctrl Z"], ["Redo", "⌘ / Ctrl Shift Z"], ["Open image", "⌘ / Ctrl O"], ["Copy ASCII", "⌘ / Ctrl C"], ["Export", "⌘ / Ctrl E"], ["Duplicate selected layer", "⌘ / Ctrl D"], ["Remove selected layer", "Delete"], ["Move selected layer", "Arrow keys"], ["Zoom canvas", "+ / −"], ["Fit canvas", "0"], ["This little guide", "?"]].map(([label, key]) => <div key={label}><dt>{label}</dt><dd><kbd>{key}</kbd></dd></div>)}</dl><p className="studio-field-hint">Canvas shortcuts work while the canvas is focused. Scroll to zoom, drag to pan, or pinch with two fingers.</p></Dialog>}
  </div>;
}
