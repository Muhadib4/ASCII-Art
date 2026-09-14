import { create } from "zustand";
import { DEFAULT_ASCII_SETTINGS, DEFAULT_ARTWORK_STYLE, DEFAULT_TEXT_SETTINGS } from "@/features/ascii/types";
import type { AsciiSettings, ArtworkStyle, CompositionLayer, PixelSource, TextSettings } from "@/features/ascii/types";

export type CreationMode = "text" | "image" | "photo" | "design";
export type InspectorTab = "source" | "adjust" | "style" | "layers";
export interface EditorDocument {
  name: string;
  mode: CreationMode;
  text: string;
  ascii: AsciiSettings;
  style: ArtworkStyle;
  textSettings: TextSettings;
  layers: CompositionLayer[];
  source: PixelSource | null;
  sourceName: string;
}
interface EditorStore {
  document: EditorDocument;
  past: EditorDocument[];
  future: EditorDocument[];
  selectedLayer: string | null;
  tab: InspectorTab;
  edit: (patch: Partial<EditorDocument>, record?: boolean) => void;
  setAscii: (patch: Partial<AsciiSettings>) => void;
  setStyle: (patch: Partial<ArtworkStyle>) => void;
  setTextSettings: (patch: Partial<TextSettings>) => void;
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  setTab: (tab: InspectorTab) => void;
  selectLayer: (id: string | null) => void;
  addLayer: (type: CompositionLayer["type"]) => void;
  updateLayer: (id: string, patch: Partial<CompositionLayer>, record?: boolean) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayer: (id: string, direction: -1 | 1) => void;
}

const initialDocument: EditorDocument = {
  name: "Untitled exploration", mode: "image", text: "ASCII",
  ascii: { ...DEFAULT_ASCII_SETTINGS }, style: { ...DEFAULT_ARTWORK_STYLE },
  textSettings: { ...DEFAULT_TEXT_SETTINGS }, layers: [], source: null, sourceName: "Classical study",
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  document: initialDocument, past: [], future: [], selectedLayer: null, tab: "source",
  edit: (patch, record = true) => set((state) => ({
    document: { ...state.document, ...patch },
    ...(record ? { past: [...state.past.slice(-39), state.document], future: [] } : {}),
  })),
  setAscii: (patch) => get().edit({ ascii: { ...get().document.ascii, ...patch } }),
  setStyle: (patch) => get().edit({ style: { ...get().document.style, ...patch } }),
  setTextSettings: (patch) => get().edit({ textSettings: { ...get().document.textSettings, ...patch } }),
  checkpoint: () => set((state) => ({ past: [...state.past.slice(-39), state.document], future: [] })),
  undo: () => set((state) => {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return { document: previous, past: state.past.slice(0, -1), future: [state.document, ...state.future], selectedLayer: null };
  }),
  redo: () => set((state) => {
    const next = state.future[0];
    if (!next) return state;
    return { document: next, past: [...state.past, state.document], future: state.future.slice(1), selectedLayer: null };
  }),
  setTab: (tab) => set({ tab }),
  selectLayer: (selectedLayer) => set({ selectedLayer }),
  addLayer: (type) => {
    const { document, edit } = get();
    const texts: Record<CompositionLayer["type"], string> = {
      title: "THE ART OF LESS", subtitle: "A study in characters.", text: "Made of nothing. Says everything.",
      badge: "[ ASCII / ORIGINAL ]", coordinates: "40°43′55.3″N  73°59′05.1″W", frame: "+ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ +",
    };
    const layer: CompositionLayer = {
      id: crypto.randomUUID(), type, text: texts[type], x: 50, y: type === "title" ? 12 : type === "subtitle" ? 85 : 92,
      fontSize: type === "title" ? 30 : type === "subtitle" ? 16 : 12,
      color: document.style.foreground, opacity: 1, alignment: "center", visible: true,
    };
    edit({ layers: [...document.layers, layer] });
    set({ selectedLayer: layer.id, tab: "layers" });
  },
  updateLayer: (id, patch, record = true) => get().edit({ layers: get().document.layers.map((layer) => layer.id === id ? { ...layer, ...patch } : layer) }, record),
  deleteLayer: (id) => { get().edit({ layers: get().document.layers.filter((layer) => layer.id !== id) }); set({ selectedLayer: null }); },
  duplicateLayer: (id) => {
    const layer = get().document.layers.find((item) => item.id === id);
    if (!layer) return;
    const copy = { ...layer, id: crypto.randomUUID(), y: Math.min(98, layer.y + 5) };
    get().edit({ layers: [...get().document.layers, copy] });
    set({ selectedLayer: copy.id });
  },
  reorderLayer: (id, direction) => {
    const layers = [...get().document.layers];
    const from = layers.findIndex((layer) => layer.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= layers.length) return;
    [layers[from], layers[to]] = [layers[to], layers[from]];
    get().edit({ layers });
  },
}));

export const EDITOR_PREFERENCES_KEY = "ascii-studio-preferences-v1";
export function persistPreferences(document: EditorDocument) {
  try {
    localStorage.setItem(EDITOR_PREFERENCES_KEY, JSON.stringify({ ascii: document.ascii, style: document.style, textSettings: document.textSettings }));
  } catch { /* Storage can be unavailable in private sessions. */ }
}

export function restorePreferences(): Partial<EditorDocument> {
  try {
    const raw = localStorage.getItem(EDITOR_PREFERENCES_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Partial<EditorDocument>;
    return {
      ...(data.ascii && typeof data.ascii.width === "number" ? { ascii: { ...DEFAULT_ASCII_SETTINGS, ...data.ascii } } : {}),
      ...(data.style && typeof data.style.fontSize === "number" ? { style: { ...DEFAULT_ARTWORK_STYLE, ...data.style } } : {}),
      ...(data.textSettings && typeof data.textSettings.width === "number" ? { textSettings: { ...DEFAULT_TEXT_SETTINGS, ...data.textSettings } } : {}),
    };
  } catch { return {}; }
}
