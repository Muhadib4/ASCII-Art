"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hand, Maximize, Maximize2, MousePointer2, Scan, ZoomIn, ZoomOut } from "lucide-react";
import { getArtworkDimensions, renderArtwork } from "@/features/ascii";
import type { AsciiResult, CompositionLayer } from "@/features/ascii/types";
import { useEditorStore } from "./store";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function CanvasPreview({ result, processing, onError }: { result: AsciiResult | null; processing: boolean; onError: (message: string) => void }) {
  const { document: doc, selectedLayer, selectLayer, updateLayer, checkpoint, setTab } = useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const layerDrag = useRef<{ id: string; x: number; y: number; clientX: number; clientY: number } | null>(null);
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dimensions = useMemo(() => result ? getArtworkDimensions(result, doc.style) : { width: 740, height: 580 }, [result, doc.style]);
  const fitScale = Math.max(0.04, Math.min((size.width - 76) / dimensions.width, (size.height - 82) / dimensions.height, 1));
  const scale = fitScale * view.zoom;

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.shiftKey) setView((previous) => ({ ...previous, x: previous.x - event.deltaY, y: previous.y - event.deltaX }));
      else setView((previous) => ({ ...previous, zoom: clamp(previous.zoom * Math.exp(-event.deltaY * 0.002), 0.15, 12) }));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => { observer.disconnect(); element.removeEventListener("wheel", onWheel); };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !result) return;
    try { renderArtwork(canvasRef.current, result, doc.style, doc.layers); }
    catch (reason) { onError(reason instanceof Error ? reason.message : "The preview could not render. Try a smaller resolution."); }
  }, [result, doc.style, doc.layers, onError]);

  const resetView = () => setView({ zoom: 1, x: 0, y: 0 });
  const zoomBy = (factor: number) => setView((previous) => ({ ...previous, zoom: clamp(previous.zoom * factor, 0.15, 12) }));

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen();
      else onError("Fullscreen is unavailable in this browser. Use your browser’s fullscreen command.");
    } catch { onError("This browser could not enter fullscreen."); }
  }

  function beginLayer(event: React.PointerEvent<HTMLButtonElement>, layer: CompositionLayer) {
    if (panMode) return;
    event.stopPropagation();
    selectLayer(layer.id);
    setTab("layers");
    checkpoint();
    layerDrag.current = { id: layer.id, x: layer.x, y: layer.y, clientX: event.clientX, clientY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  return <div className="studio-preview" ref={rootRef}>
    <div className="studio-canvas-topline"><span><span className="studio-live-dot" /> LIVE CANVAS</span><span>{processing ? "[ ░▒▓ ] Processing" : result ? `${result.cols} × ${result.rows} CHARACTERS` : "YOUR NEXT EXPLORATION"}</span></div>
    <div className={`studio-viewport ${panMode ? "pan-mode" : ""} ${dragging ? "is-dragging" : ""}`} ref={viewportRef} tabIndex={0} aria-label="Artwork canvas. Scroll to zoom, drag to pan, or select a composition layer."
      onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "+" || event.key === "=") { event.preventDefault(); zoomBy(1.2); } else if (event.key === "-") { event.preventDefault(); zoomBy(1 / 1.2); } else if (event.key === "0") { event.preventDefault(); resetView(); } }}
      onPointerDown={(event) => {
        if (event.button !== 0 && event.button !== 1) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        setDragging(true);
        if (!panMode) selectLayer(null);
      }}
      onPointerMove={(event) => {
        const previous = pointers.current.get(event.pointerId);
        if (!previous) return;
        const values = [...pointers.current.values()];
        const oldDistance = values.length === 2 ? Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y) : 0;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const nextValues = [...pointers.current.values()];
        const distance = nextValues.length === 2 ? Math.hypot(nextValues[0].x - nextValues[1].x, nextValues[0].y - nextValues[1].y) : 0;
        const divisor = nextValues.length > 1 ? 2 : 1;
        setView((current) => ({ zoom: oldDistance > 0 ? clamp(current.zoom * distance / oldDistance, 0.15, 12) : current.zoom, x: current.x + (event.clientX - previous.x) / divisor, y: current.y + (event.clientY - previous.y) / divisor }));
      }}
      onPointerUp={(event) => { pointers.current.delete(event.pointerId); if (!pointers.current.size) setDragging(false); }}
      onPointerCancel={(event) => { pointers.current.delete(event.pointerId); setDragging(false); }}
      onDoubleClick={resetView}>
      <div className="studio-ruler studio-ruler-x" aria-hidden="true">000<span>100</span><span>200</span><span>300</span><span>400</span><span>500</span><span>600</span><span>700</span></div>
      <div className="studio-ruler studio-ruler-y" aria-hidden="true">000<span>100</span><span>200</span><span>300</span><span>400</span></div>
      {result ? <div className="studio-artwork-position" style={{ width: dimensions.width, height: dimensions.height, transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})` }}>
        <canvas ref={canvasRef} className="studio-artwork" style={{ width: dimensions.width, height: dimensions.height }} role="img" aria-label={`${doc.name}: ${result.cols} columns by ${result.rows} rows of ASCII art, with ${doc.layers.length} composition layers`} />
        {doc.layers.filter((layer) => layer.visible).map((layer) => <button key={layer.id} className={`studio-canvas-layer ${selectedLayer === layer.id ? "selected" : ""}`} aria-label={`Select and move ${layer.type}: ${layer.text.slice(0, 80)}`} aria-pressed={selectedLayer === layer.id} style={{ left: `${layer.x}%`, top: `${layer.y}%`, width: Math.max(40, Math.max(...layer.text.split("\n").map((line) => line.length)) * layer.fontSize * 0.62), height: Math.max(layer.fontSize * 1.2, layer.text.split("\n").length * layer.fontSize * 1.2), transform: `translateX(${layer.alignment === "center" ? "-50%" : layer.alignment === "right" ? "-100%" : "0"})`, borderWidth: 1 / scale }}
          onFocus={() => selectLayer(layer.id)}
          onPointerDown={(event) => beginLayer(event, layer)}
          onPointerMove={(event) => { const drag = layerDrag.current; if (!drag || drag.id !== layer.id) return; event.stopPropagation(); updateLayer(layer.id, { x: clamp(drag.x + (event.clientX - drag.clientX) / scale / dimensions.width * 100, 0, 100), y: clamp(drag.y + (event.clientY - drag.clientY) / scale / dimensions.height * 100, 0, 100) }, false); }}
          onPointerUp={(event) => { if (layerDrag.current) { event.stopPropagation(); layerDrag.current = null; } }}
          onPointerCancel={() => { layerDrag.current = null; }}
          onKeyDown={(event) => { const distance = event.shiftKey ? 5 : 0.5; if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); updateLayer(layer.id, { x: clamp(layer.x + (event.key === "ArrowLeft" ? -distance : event.key === "ArrowRight" ? distance : 0), 0, 100), y: clamp(layer.y + (event.key === "ArrowUp" ? -distance : event.key === "ArrowDown" ? distance : 0), 0, 100) }); } }}
        ><span className="studio-sr-only">{layer.type}</span></button>)}
        <span className="studio-artwork-corner top-left" /><span className="studio-artwork-corner top-right" /><span className="studio-artwork-corner bottom-left" /><span className="studio-artwork-corner bottom-right" />
      </div> : <div className="studio-canvas-empty"><pre aria-hidden="true">{`+------------------+\n|                  |\n|     YOUR ART     |\n|     GOES HERE    |\n|                  |\n+------------------+`}</pre><h2>A little input. Infinite possibility.</h2><p>{doc.mode === "text" ? "Type something in Source to begin." : "Drop an image, use your camera, or try a sample."}</p></div>}
      <span className="studio-canvas-note">{selectedLayer ? "DRAG LAYER TO COMPOSE" : "SCROLL TO ZOOM · DRAG TO EXPLORE"}</span>
    </div>
    <div className="studio-canvas-controls">
      <div className="studio-tool-segment"><button aria-label="Select layers" title="Select layers" aria-pressed={!panMode} onClick={() => setPanMode(false)}><MousePointer2 size={16} /></button><button aria-label="Pan canvas" title="Pan canvas" aria-pressed={panMode} onClick={() => setPanMode(true)}><Hand size={16} /></button></div>
      <div className="studio-tool-segment"><button aria-label="Zoom out" title="Zoom out (-)" onClick={() => zoomBy(1 / 1.2)}><ZoomOut size={16} /></button><button className="studio-zoom-label" onClick={() => setView({ zoom: 1 / fitScale, x: 0, y: 0 })} title="Show at 100%" aria-label="Set zoom to 100 percent">{Math.round(scale * 100)}%</button><button aria-label="Zoom in" title="Zoom in (+)" onClick={() => zoomBy(1.2)}><ZoomIn size={16} /></button></div>
      <div className="studio-tool-segment"><button className="studio-fit-button" aria-label="Fit artwork and reset view" title="Fit artwork (0)" onClick={resetView}><Scan size={15} /><span>Fit</span></button><button aria-label="Show at 100 percent" title="Actual size / 100%" onClick={() => setView({ zoom: 1 / fitScale, x: 0, y: 0 })}><Maximize2 size={15} /></button><button aria-label="Toggle fullscreen preview" title="Fullscreen" onClick={() => void fullscreen()}><Maximize size={15} /></button></div>
    </div>
  </div>;
}
