'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import SiteHeader from './site-header';
import AsciiStudy from './ascii-study';
import { presets } from '@/features/presets/presets';

export default function PresetGallery() {
  const [category, setCategory] = useState('ALL');
  const categories = ['ALL', ...new Set(presets.map(p => p.category))];
  return <div className="gallery-page"><SiteHeader active="presets" /><main id="main"><section className="gallery-intro"><div className="eyebrow">[ THE PRESET LIBRARY / 014 ]</div><h1>Borrow a mood.<br />Make it your own.</h1><p>Fourteen starting points, each with its own character.<br />A complete combination of processing, typography, and color. All yours to change.</p><div className="gallery-filters" aria-label="Filter presets">{categories.map(item => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>{item === 'ALL' ? 'ALL PRESETS' : item}</button>)}</div></section><div className="gallery-grid">{presets.filter(p => category === 'ALL' || p.category === category).map((preset) => <Link className="featured-card" href={`/studio?mode=${preset.id === 'ascii-poster' ? 'design' : 'image'}&preset=${preset.id}`} key={preset.id}><div className="featured-art" style={{ background: preset.style.background, color: preset.style.foreground ?? preset.style.gradientFrom ?? preset.style.duotoneLight }}><span className="preset-bracket">+</span><AsciiStudy kind={(['sphere','landscape','wave','flower'] as const)[presets.indexOf(preset) % 4]} /><span className="preset-preview-label">{preset.category} / {preset.ascii.dither ?? 'NONE'} / {preset.ascii.width} COLS</span><span className="preset-launch"><ArrowUpRight size={20} /></span></div><div className="featured-caption"><h3>{preset.name}</h3><ArrowUpRight size={15} /></div><p className="gallery-description">{preset.description}</p></Link>)}</div><p className="gallery-end">A preset is just the beginning. Every parameter is yours to change.</p></main></div>;
}
