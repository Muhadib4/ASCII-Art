'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Camera, Check, Circle, Code2, Command, Image as ImageIcon, Layers3, Maximize2, Pause, Play, Plus, ShieldCheck, SlidersHorizontal, Type } from 'lucide-react';
import SiteHeader, { themeOptions } from './site-header';
import AsciiSculpture from './ascii-sculpture';
import AsciiStudy from './ascii-study';
import PixelCard from './react-bits/PixelCard';
import { EffectManager } from './effects/EffectManager';
import { usePreferences } from '@/features/themes/store';

const modes = [
  { id: 'text', number: '01', title: 'Text Lab', tagline: 'Words with a little more weight.', detail: 'TYPE SOMETHING', icon: Type, art: 'type' as const },
  { id: 'image', number: '02', title: 'Image Lab', tagline: 'Every pixel has a character.', detail: 'DROP AN IMAGE', icon: ImageIcon, art: 'sphere' as const },
  { id: 'photo', number: '03', title: 'Photo Booth', tagline: 'A different kind of self-portrait.', detail: 'OPEN YOUR CAMERA', icon: Camera, art: 'flower' as const },
  { id: 'design', number: '04', title: 'Design Space', tagline: 'Put it all together. Make it yours.', detail: 'BUILD A COMPOSITION', icon: Layers3, art: 'wave' as const },
];
const featured = [
  { id: 'terminal-portrait', name: 'Terminal Portrait', tag: 'CLASSIC / MONO', kind: 'sphere' as const, className: 'preset-mono' },
  { id: 'matrix', name: 'Matrix Terminal', tag: 'PHOSPHOR / GREEN', kind: 'landscape' as const, className: 'preset-green' },
  { id: 'blueprint', name: 'Blueprint', tag: 'TECHNICAL / BLUE', kind: 'wave' as const, className: 'preset-blue' },
  { id: 'cyber-ascii', name: 'Cyber ASCII', tag: 'GRADIENT / NEON', kind: 'flower' as const, className: 'preset-purple' },
];

export default function Home() {
  const [density, setDensity] = useState(1);
  const [comparison, setComparison] = useState(0);
  const [paused, setPaused] = useState(false);
  const { theme, setTheme } = usePreferences();
  return <div className="home-shell">
    <SiteHeader />
    <main id="main">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-effects"><EffectManager page="home" /></div>
        <div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> SMALL CHARACTERS. ENDLESS POSSIBILITIES.</div>
          <h1 id="hero-title">A little less pixel.<br />A little more<br /><span className="character-word">character<span className="period">.</span></span></h1>
          <p>Turn the ordinary into something unexpected.<br className="desktop-break" /> A creative playground for text, images, and the<br className="desktop-break" /> beautiful space in between.</p>
          <div className="hero-buttons"><Link className="button primary large" href="/studio?mode=image">Start creating <ArrowUpRight size={19} /></Link><a className="text-link" href="#create">Explore the studio <ArrowDown size={14} /></a></div>
          <div className="local-note"><ShieldCheck size={13} /><span>NO SIGN-UP. NO UPLOADS. JUST YOU + YOUR BROWSER.</span></div>
        </div>
        <div className="hero-art" id="playground">
          <div className="art-topline"><span><span className="live-dot" /> LIVE ASCII RENDER</span><span>FIG. 001 — INFINITE FORM</span></div>
          <div className="sculpture-stage"><span className="corner-mark top-left">+</span><span className="corner-mark top-right">+</span><span className="corner-mark bottom-left">+</span><span className="corner-mark bottom-right">+</span><AsciiSculpture density={density} comparison={comparison} paused={paused} /><div className="sculpture-coordinate">X 0.024<br />Y 0.618<br />Z 1.000</div><span className="art-side-caption">A STUDY IN CHARACTER</span></div>
          <div className="art-controls"><div className="segmented render-toggle"><button aria-pressed={comparison === 0} onClick={() => setComparison(0)}>ASCII</button><button aria-pressed={comparison === 1} onClick={() => setComparison(1)}>Original</button></div><div className="art-utility"><span>{Math.round(106 * density)} COLS</span><button className="icon-button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play sculpture animation' : 'Pause sculpture animation'}>{paused ? <Play size={13} /> : <Pause size={13} />}</button><Link className="icon-button" aria-label="Open full editor" href="/studio?mode=image"><Maximize2 size={14} /></Link></div></div>
          <div className="playground-sliders"><label><SlidersHorizontal size={12} /> Density<input aria-label="Sculpture density" type="range" min="0.6" max="1.4" step="0.1" value={density} onChange={e => setDensity(Number(e.target.value))} /></label><label>Compare<input aria-label="Compare original with ASCII" type="range" min="0" max="1" step="0.05" value={comparison} onChange={e => setComparison(Number(e.target.value))} /></label></div>
        </div>
      </section>
      <div className="studio-ticker" aria-label="Studio capabilities"><span><span className="ticker-star">✳</span> MADE OF CHARACTERS</span><span>BUILT FOR EXPRESSION</span><span><Code2 size={14} /> 100% IN YOUR BROWSER</span><span>INFINITELY YOURS <span className="ticker-star">✳</span></span></div>
      <section className="create-section content-section" id="create" aria-labelledby="create-title"><div className="section-heading"><div><span className="eyebrow">[ 01 — THE STUDIO ]</span><h2 id="create-title">Everything starts with something.</h2></div><span className="section-aside">PICK YOUR STARTING POINT <ArrowDown size={13} /></span></div><div className="creation-grid">{modes.map(mode => <PixelCard key={mode.id} className="creation-card"><Link href={`/studio?mode=${mode.id}`} className="creation-card-link"><div className="creation-top"><mode.icon size={20} strokeWidth={1.4} /><span>/{mode.number}</span></div><div className={`mode-art mode-art-${mode.id}`}>{mode.id === 'text' ? <pre aria-hidden="true">{'█▀█ █▀ █▀ █ █\n█▀█ ▄█ █▄ █ █'}</pre> : mode.id === 'design' ? <div className="mini-composition"><span>BE<br />MORE<span className="mini-outline">ASCII.</span></span><span className="mini-poster-meta">EXPERIMENT № 004<br />35° N / 139° E</span></div> : <AsciiStudy kind={mode.art} />}</div><h3>{mode.title}</h3><p>{mode.tagline}</p><div className="creation-bottom"><span>{mode.detail}</span><ArrowUpRight size={17} /></div></Link></PixelCard>)}</div></section>
      <section className="preset-section content-section" id="presets" aria-labelledby="presets-title"><div className="section-heading"><div><span className="eyebrow">[ 02 — A HEAD START ]</span><h2 id="presets-title">A starting point. Never a limit.</h2></div><Link className="text-link" href="/presets">Explore all presets <ArrowUpRight size={15} /></Link></div><div className="featured-grid">{featured.map(preset => <Link key={preset.id} href={`/studio?mode=image&preset=${preset.id}`} className={`featured-card ${preset.className}`}><div className="featured-art"><span className="preset-bracket">+</span><AsciiStudy kind={preset.kind} /><span className="preset-preview-label">{preset.tag}</span><span className="preset-launch"><ArrowUpRight size={17} /></span></div><div className="featured-caption"><h3>{preset.name}</h3><span>↗</span></div></Link>)}</div></section>
      <section className="theme-section content-section" id="themes" aria-labelledby="theme-title"><div className="theme-intro"><span className="eyebrow">[ 03 — FIND YOUR FREQUENCY ]</span><h2 id="theme-title">Same studio.<br />Different state of mind.</h2><p>Change the atmosphere. The light, the sound,<br />the way it all feels. Make yourself at home.</p></div><div className="home-theme-grid">{themeOptions.map(option => <button key={option.id} onClick={() => setTheme(option.id)} aria-pressed={theme === option.id} className={`home-theme-option home-theme-${option.id}`}><span className="theme-mini-art" style={{ color: option.color }}>{option.id === 'mono' ? 'Aa_' : option.id === 'terminal' ? '>_█' : option.id === 'neon' ? '×+×' : '❄'}</span><span className="home-theme-caption"><span>{option.name}</span>{theme === option.id ? <Check size={14} /> : <Circle size={12} />}</span><span className="home-theme-number">0{themeOptions.indexOf(option) + 1}</span></button>)}</div></section>
      <section className="closing-section content-section" id="about"><span className="closing-star">✳</span><div><div className="eyebrow">THE INTERNET COULD USE A LITTLE MORE WEIRD.</div><h2>Make something only you would make.</h2></div><Link className="button primary" href="/studio?mode=text">Your canvas is waiting <ArrowRight size={17} /></Link></section>
    </main>
    <footer className="site-footer"><Link className="wordmark" href="/">ASCII<span>®</span></Link><span>AN INDEPENDENT EXPERIMENT IN DIGITAL EXPRESSION.</span><div><span className="live-dot" /> ALL SYSTEMS LOCAL <Plus size={13} /><span>EST. 2026</span></div><span className="footer-command"><Command size={11} /> CREATE SOMETHING.</span></footer>
  </div>;
}
