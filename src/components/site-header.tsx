'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, AudioLines, Check, ChevronDown, Moon, Settings2, Sun, Volume2, VolumeX } from 'lucide-react';
import { usePreferences } from '@/features/themes/store';
import { audioManager } from '@/features/audio/AudioManager';
import Dialog from './dialog';

export const themeOptions = [
  { id: 'mono', name: 'Mono / Noir', sub: 'Less, but better.', color: '#e8e8e4', code: '01' },
  { id: 'terminal', name: 'Terminal', sub: 'A familiar future.', color: '#8de69b', code: '02' },
  { id: 'neon', name: 'Neon Grid', sub: 'After hours, online.', color: '#bba0ff', code: '03' },
  { id: 'winter', name: 'Pixel Winter', sub: 'A quieter frequency.', color: '#b2d9f3', code: '04' },
] as const;

export function PreferencesDialog({ onClose }: { onClose: () => void }) {
  const { theme, mode, audio, effects, setTheme, setMode, setAudio, setEffects } = usePreferences();
  const toggleAudio = () => { if (audio.muted) void audioManager.unlock(); setAudio({ muted: !audio.muted }); };
  return <Dialog title="Set your atmosphere." onClose={onClose}>
    <p className="dialog-description">Four different worlds. One place to create.</p>
    <div className="theme-options">{themeOptions.map(option => <button key={option.id} className={`theme-option ${theme === option.id ? 'selected' : ''}`} onClick={() => setTheme(option.id)} aria-pressed={theme === option.id}><span className="theme-swatch" style={{ background: option.color }} /><span><strong>{option.name}</strong><small>{option.sub}</small></span>{theme === option.id && <Check size={16} />}</button>)}</div>
    <div className="preference-row"><span>Brightness</span><div className="segmented"><button onClick={() => setMode('dark')} aria-pressed={mode === 'dark'}><Moon size={14} /> Dark</button><button onClick={() => setMode('light')} aria-pressed={mode === 'light'}><Sun size={14} /> Light</button></div></div>
    <div className="preference-row"><span>Interactive effects<small>Motion adapts to your device preferences.</small></span><button className={`switch ${effects ? 'on' : ''}`} role="switch" aria-checked={effects} aria-label="Interactive effects" onClick={() => setEffects(!effects)}><span /></button></div>
    <div className="preference-row"><span>Studio audio<small>Procedural ambience. No recordings.</small></span><button className="button small" onClick={toggleAudio}>{audio.muted ? <VolumeX size={14} /> : <AudioLines size={14} />}{audio.muted ? 'Muted' : 'Sound on'}</button></div>
    <div className="audio-sliders">{(['master', 'bgm', 'sfx'] as const).map(key => <label key={key}><span>{({ master: 'Master', bgm: 'Ambience', sfx: 'UI & effects' })[key]}</span><input type="range" min="0" max="1" step="0.01" value={audio[key]} onChange={e => setAudio({ [key]: Number(e.target.value) })} /><output>{Math.round(audio[key] * 100)}%</output></label>)}</div>
    <p className="settings-note">Your preferences stay in this browser.</p>
  </Dialog>;
}

export default function SiteHeader({ active = 'home' }: { active?: 'home' | 'studio' | 'presets' }) {
  const [settings, setSettings] = useState(false);
  const { theme, mode, setMode, audio, setAudio } = usePreferences();
  return <>
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="ASCII home">ASCII<span>®</span></Link>
      <div className="brand-divider" /><span className="brand-caption">A CREATIVE<br />CHARACTER STUDIO</span>
      <nav aria-label="Main navigation"><Link href="/studio" className={active === 'studio' ? 'active' : ''}>Studio</Link><Link href="/presets" className={active === 'presets' ? 'active' : ''}>Presets</Link><Link href="/#playground">Playground <ArrowUpRight size={11} /></Link></nav>
      <div className="header-actions"><button className="theme-select" onClick={() => setSettings(true)} aria-label="Theme and sound settings"><span className="tiny-square" />{themeOptions.find(t => t.id === theme)?.name}<ChevronDown size={12} /></button><button className="icon-button brightness-toggle" title="Toggle brightness" aria-label="Toggle light and dark mode" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>{mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button><button className="icon-button" aria-label={audio.muted ? 'Enable sound' : 'Mute sound'} title={audio.muted ? 'Sound off' : 'Sound on'} onClick={() => { if (audio.muted) void audioManager.unlock(); setAudio({ muted: !audio.muted }); }}>{audio.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button><button className="icon-button mobile-settings" aria-label="Open studio settings" onClick={() => setSettings(true)}><Settings2 size={17} /></button></div>
    </header>
    {settings && <PreferencesDialog onClose={() => setSettings(false)} />}
  </>;
}
