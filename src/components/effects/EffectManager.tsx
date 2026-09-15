'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { themeById, themeEffects } from '@/features/themes/config';
import { usePreferences } from '@/features/themes/store';
import '../react-bits/effects.css';

const PixelTrail = dynamic(() => import('../react-bits/PixelTrail'), { ssr: false });
const PixelBlast = dynamic(() => import('../react-bits/PixelBlast'), { ssr: false });
const PixelSnow = dynamic(() => import('../react-bits/PixelSnow'), { ssr: false });

class EffectBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="studio-effects-fallback" /> : this.props.children; }
}

/** At most two contexts on desktop, one on slower/touch devices, none while hidden. */
export function EffectManager({ page = 'home' }: { page?: 'home' | 'editor' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '');
  const theme = usePreferences(state => state.theme);
  const mode = usePreferences(state => state.mode);
  const enabled = usePreferences(state => state.effects);
  const [capabilities, setCapabilities] = useState({ ready: false, reduced: true, finePointer: false, lowPower: true, webgl: false });
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let webgl = false;
    const sync = () => setCapabilities({ ready: true, reduced: reduced.matches, finePointer: fine.matches,
      lowPower: (navigator.hardwareConcurrency || 8) <= 4 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4,
      webgl,
    });
    const timer = window.setTimeout(() => {
      if (!reduced.matches) {
        const probe = document.createElement('canvas');
        try {
          const context = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
          webgl = !!context;
          context?.getExtension('WEBGL_lose_context')?.loseContext();
        } catch { webgl = false; }
      }
      sync();
    }, 200);
    reduced.addEventListener('change', sync); fine.addEventListener('change', sync);
    return () => { clearTimeout(timer); reduced.removeEventListener('change', sync); fine.removeEventListener('change', sync); };
  }, []);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let intersects = false;
    const sync = () => setVisible(intersects && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersects = entry.isIntersecting; sync(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const config = themeEffects[theme];
  const palette = themeById[theme][mode];
  const active = capabilities.ready && enabled && !capabilities.reduced && capabilities.webgl && visible && !failed;
  const environment = page === 'home' ? config.environment : null;
  const showTrail = capabilities.finePointer && !(capabilities.lowPower && environment);
  return <div ref={containerRef} className="studio-effects" aria-hidden="true">
    <div className="studio-effects-fallback" />
    {config.crt && enabled && <div className="studio-crt" />}
    {active && <EffectBoundary key={theme}>
      {showTrail && <div className="studio-effects-trail"><PixelTrail {...themeById[theme].trail} color={palette.accent}
        gooeyFilter={{ id: `ascii-trail-${uniqueId}`, strength: themeById[theme].trail.strength }} onError={fail} /></div>}
      {environment === 'blast' && 'blast' in config && <div className="studio-effects-environment"><PixelBlast {...config.blast} color={palette.accent}
        liquid={!capabilities.lowPower && capabilities.finePointer} onError={fail} /></div>}
      {environment === 'snow' && 'snow' in config && <div className="studio-effects-environment"><PixelSnow {...config.snow} color={palette.accent}
        farPlane={capabilities.lowPower ? 7 : config.snow.farPlane} pixelResolution={capabilities.lowPower ? 140 : config.snow.pixelResolution} onError={fail} /></div>}
    </EffectBoundary>}
  </div>;
}
