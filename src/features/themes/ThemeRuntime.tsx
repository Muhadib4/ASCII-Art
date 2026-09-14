'use client';

import { useEffect } from 'react';
import { audioManager } from '../audio/AudioManager';
import { themeById, themeVariables } from './config';
import { usePreferences } from './store';

/** SSR stays Mono/Dark; stored preferences are read only after the first client render. */
export function ThemeRuntime() {
  const theme = usePreferences(state => state.theme);
  const mode = usePreferences(state => state.mode);
  const audio = usePreferences(state => state.audio);

  useEffect(() => { void usePreferences.persist.rehydrate(); }, []);
  useEffect(() => {
    const root = document.documentElement;
    const config = themeById[theme];
    root.dataset.theme = theme;
    root.dataset.mode = mode;
    root.dataset.layout = config.layout;
    root.style.colorScheme = mode;
    Object.entries(themeVariables(config, mode)).forEach(([key, value]) => root.style.setProperty(key, value));
  }, [theme, mode]);
  useEffect(() => { audioManager.configure(audio, theme); }, [audio, theme]);

  useEffect(() => {
    const gesture = () => {
      if (!usePreferences.getState().audio.muted) void audioManager.unlock();
    };
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('button,a,[role="button"]') : null;
      if (target && !target.hasAttribute('disabled')) audioManager.play('click');
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const target = event.target instanceof Element ? event.target.closest('button,a,[role="button"]') : null;
      if (target && !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) audioManager.play('hover');
    };
    const change = (event: Event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === 'range') audioManager.play('slider');
      else if (event.target instanceof HTMLSelectElement) audioManager.play('dropdown');
    };
    const visibility = () => audioManager.setVisible(document.visibilityState === 'visible');
    document.addEventListener('pointerdown', gesture, { passive: true });
    document.addEventListener('keydown', gesture);
    document.addEventListener('click', click);
    document.addEventListener('pointerover', hover, { passive: true });
    document.addEventListener('input', change);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('pointerdown', gesture);
      document.removeEventListener('keydown', gesture);
      document.removeEventListener('click', click);
      document.removeEventListener('pointerover', hover);
      document.removeEventListener('input', change);
      document.removeEventListener('visibilitychange', visibility);
      audioManager.dispose();
    };
  }, []);
  return null;
}
