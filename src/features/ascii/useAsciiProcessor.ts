"use client";

import { useEffect, useRef, useState } from "react";
import { processImage } from "./processor";
import { generateTextArt } from "./text";
import { DEFAULT_TEXT_SETTINGS, type AsciiResult, type AsciiSettings, type PixelSource, type TextSettings } from "./types";

export interface WorkerRequest { id: number; source: PixelSource; settings: AsciiSettings }
export interface WorkerResponse { id: number; result?: AsciiResult; error?: string }

/** Debounced conversion with a single outstanding worker job and a newest-request-only queue. */
export function useAsciiProcessor(source: PixelSource | null, settings: AsciiSettings, textInput: string | null = null, textSettings: TextSettings = DEFAULT_TEXT_SETTINGS) {
  const [state, setState] = useState<{ result: AsciiResult | null; processing: boolean; error: string | null }>({ result: null, processing: false, error: null });
  const generation = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const busy = useRef(false);
  const pending = useRef<WorkerRequest | null>(null);

  useEffect(() => {
    let worker: Worker | null = null;
    const fallback = () => {
      const request = pending.current;
      pending.current = null;
      busy.current = false;
      if (!request || request.id !== generation.current) return;
      try {
        const result = processImage(request.source, request.settings);
        setState({ result, processing: false, error: null });
      } catch (reason) {
        setState(previous => ({ ...previous, processing: false, error: reason instanceof Error ? reason.message : "Processing failed. Try a smaller image." }));
      }
    };
    try {
      worker = new Worker(new URL("../../workers/ascii.worker.ts", import.meta.url));
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        busy.current = false;
        if (event.data.id === generation.current) {
          setState(previous => ({ result: event.data.result ?? previous.result, processing: false, error: event.data.error ?? null }));
        }
        const next = pending.current;
        if (next && next.id === generation.current && next.id !== event.data.id) {
          busy.current = true;
          worker?.postMessage(next);
        } else pending.current = null;
      };
      worker.onerror = (event) => {
        event.preventDefault();
        worker?.terminate();
        workerRef.current = null;
        fallback();
      };
    } catch { workerRef.current = null; }
    return () => { worker?.terminate(); workerRef.current = null; busy.current = false; pending.current = null; };
  }, []);

  useEffect(() => {
    const id = ++generation.current;
    setState(previous => ({ ...previous, processing: Boolean(source || textInput), error: null }));
    const timer = setTimeout(() => {
      if (textInput !== null) {
        pending.current = null;
        try { setState({ result: generateTextArt(textInput, textSettings), processing: false, error: null }); }
        catch (reason) { setState(previous => ({ ...previous, processing: false, error: reason instanceof Error ? reason.message : "Text could not be generated." })); }
        return;
      }
      if (!source) { setState({ result: null, processing: false, error: null }); return; }
      const request: WorkerRequest = { id, source, settings };
      setState(previous => ({ ...previous, processing: true, error: null }));
      pending.current = request;
      if (workerRef.current) {
        if (!busy.current) { busy.current = true; workerRef.current.postMessage(request); }
        return;
      }
      // Workers may be blocked by browser privacy policies; bounded sources keep this fallback usable.
      try { setState({ result: processImage(source, settings), processing: false, error: null }); }
      catch (reason) { setState(previous => ({ ...previous, processing: false, error: reason instanceof Error ? reason.message : "Processing failed. Try another image." })); }
      pending.current = null;
    }, 70);
    return () => clearTimeout(timer);
  }, [source, settings, textInput, textSettings]);

  return state;
}
