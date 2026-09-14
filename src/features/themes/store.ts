'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type BrightnessMode, type ThemeId, themeById } from './config';

export interface AudioPreferences { master: number; bgm: number; sfx: number; muted: boolean }
export const defaultAudio: AudioPreferences = { master: .5, bgm: .22, sfx: .55, muted: true };
interface PreferencesState {
  theme: ThemeId;
  mode: BrightnessMode;
  audio: AudioPreferences;
  effects: boolean;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: BrightnessMode) => void;
  setAudio: (audio: Partial<AudioPreferences>) => void;
  setEffects: (enabled: boolean) => void;
}
const volume = (value: unknown, fallback: number): number => typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
function normalizeAudio(audio: Partial<AudioPreferences> | undefined): AudioPreferences {
  return { master: volume(audio?.master, .5), bgm: volume(audio?.bgm, .22), sfx: volume(audio?.sfx, .55), muted: typeof audio?.muted === 'boolean' ? audio.muted : true };
}

export const usePreferences = create<PreferencesState>()(persist((set) => ({
  theme: 'mono', mode: 'dark', audio: defaultAudio, effects: true,
  setTheme: theme => set({ theme }),
  setMode: mode => set({ mode }),
  setAudio: partial => set(state => ({ audio: normalizeAudio({ ...state.audio, ...partial }) })),
  setEffects: effects => set({ effects }),
}), {
  name: 'ascii-studio-preferences', version: 1,
  storage: createJSONStorage(() => localStorage), skipHydration: true,
  partialize: ({ theme, mode, audio, effects }) => ({ theme, mode, audio, effects }),
  merge: (persisted, current) => {
    const saved = persisted as Partial<PreferencesState> | null;
    return {
      ...current,
      theme: saved?.theme && Object.hasOwn(themeById, saved.theme) ? saved.theme : 'mono',
      mode: saved?.mode === 'light' ? 'light' : 'dark',
      audio: normalizeAudio(saved?.audio),
      effects: typeof saved?.effects === 'boolean' ? saved.effects : true,
    };
  },
}));
