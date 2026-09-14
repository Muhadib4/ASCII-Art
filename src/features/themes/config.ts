export type ThemeId = 'mono' | 'terminal' | 'neon' | 'winter';
export type BrightnessMode = 'dark' | 'light';

export interface ThemePalette {
  bg: string; surface: string; raised: string; text: string; muted: string;
  accent: string; accentContrast: string; border: string;
}
export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  swatches: string[];
  accent: string;
  layout: 'editorial' | 'workstation' | 'modular' | 'spacious';
  labelPrefix: string;
  dark: ThemePalette;
  light: ThemePalette;
  radius: string;
  gap: string;
  font: string;
  shadow: string;
  glow: string;
  duration: string;
  ease: string;
  loading: string[];
  trail: { gridSize: number; trailSize: number; maxAge: number; interpolate: number; strength: number };
  card: { gap: number; speed: number; colors: string };
  audio: { wave: OscillatorType; root: number; chord: number[]; click: number; decay: number; filter: number };
}

const sans = "'Space Grotesk Variable', Arial, sans-serif";
export const monoFont = "'IBM Plex Mono', 'Courier New', monospace";

export const themes: ThemeConfig[] = [
  {
    id: 'mono', name: 'Mono / Noir', tagline: 'Less noise. More signal.',
    description: 'An editorial study in light, type, and negative space.',
    swatches: ['#0b0b0b', '#717171', '#f2f0e9'], accent: '#f2f0e9',
    layout: 'editorial', labelPrefix: '',
    dark: { bg: '#090a0a', surface: '#101111', raised: '#181919', text: '#eeeee8', muted: '#999b98', accent: '#eeeee8', accentContrast: '#101111', border: '#303230' },
    light: { bg: '#ecece5', surface: '#f7f7f0', raised: '#ffffff', text: '#171916', muted: '#5d615a', accent: '#22251e', accentContrast: '#ffffff', border: '#c7ccc1' },
    radius: '0px', gap: '20px', font: sans,
    shadow: 'none', glow: 'none', duration: '180ms', ease: 'cubic-bezier(.2,.75,.25,1)',
    loading: ['[■····]', '[·■···]', '[··■··]', '[···■·]', '[····■]'],
    trail: { gridSize: 50, trailSize: .075, maxAge: 250, interpolate: 5, strength: 2 },
    card: { gap: 9, speed: 22, colors: '#e6e6df,#babbb3,#777a71' },
    audio: { wave: 'sine', root: 55, chord: [1, 1.498, 2.002], click: 680, decay: .045, filter: 700 },
  },
  {
    id: 'terminal', name: 'Terminal', tagline: 'Awaiting your next command_',
    description: 'Phosphor traces, precise grids, and a little machine nostalgia.',
    swatches: ['#08100b', '#3c7150', '#9bffaf'], accent: '#9bffaf',
    layout: 'workstation', labelPrefix: '> ',
    dark: { bg: '#07100b', surface: '#0a170f', raised: '#102418', text: '#b2efb9', muted: '#79a981', accent: '#9bffaf', accentContrast: '#07100b', border: '#28583a' },
    light: { bg: '#e5eddb', surface: '#eff4e8', raised: '#f9fff0', text: '#193821', muted: '#4f6c45', accent: '#286336', accentContrast: '#ffffff', border: '#8dac81' },
    radius: '0px', gap: '12px', font: monoFont,
    shadow: '3px 3px 0 color-mix(in srgb, var(--accent) 13%, transparent)',
    glow: '0 0 18px color-mix(in srgb, var(--accent) 14%, transparent)', duration: '90ms', ease: 'steps(3,end)',
    loading: ['[>    ]', '[=>   ]', '[==>  ]', '[===> ]', '[====>]'],
    trail: { gridSize: 66, trailSize: .055, maxAge: 350, interpolate: 4, strength: 1 },
    card: { gap: 8, speed: 30, colors: '#9bffaf,#5bad72,#285b3b' },
    audio: { wave: 'square', root: 49, chord: [1, 2.005, 3], click: 1080, decay: .035, filter: 230 },
  },
  {
    id: 'neon', name: 'Neon Grid', tagline: 'A different frequency.',
    description: 'Floating instruments in a violet field of digital matter.',
    swatches: ['#100d1c', '#ad9eff', '#7ddddc'], accent: '#bcaaff',
    layout: 'modular', labelPrefix: '// ',
    dark: { bg: '#0d0b15', surface: '#151121', raised: '#211a33', text: '#f0eaff', muted: '#aa9fc0', accent: '#bcaaff', accentContrast: '#1a1132', border: '#443559' },
    light: { bg: '#ebe8f6', surface: '#f7f3ff', raised: '#ffffff', text: '#31264a', muted: '#766489', accent: '#6742ab', accentContrast: '#ffffff', border: '#c2acd9' },
    radius: '10px', gap: '18px', font: sans,
    shadow: '0 10px 36px #06030f30',
    glow: '0 0 26px color-mix(in srgb, var(--accent) 17%, transparent)', duration: '320ms', ease: 'cubic-bezier(.16,1,.3,1)',
    loading: ['◇ ◇ ◇', '◆ ◇ ◇', '◆ ◆ ◇', '◆ ◆ ◆', '◇ ◆ ◆'],
    trail: { gridSize: 44, trailSize: .08, maxAge: 320, interpolate: 6, strength: 3 },
    card: { gap: 7, speed: 45, colors: '#cbb8ff,#9b82e8,#72dadc' },
    audio: { wave: 'triangle', root: 65.406, chord: [1, 1.2599, 1.4983, 2], click: 520, decay: .11, filter: 1100 },
  },
  {
    id: 'winter', name: 'Pixel Winter', tagline: 'A quiet place to create.',
    description: 'A spacious observatory of pale pixels and slow snowfall.',
    swatches: ['#0d1620', '#7d9cae', '#c6e9ff'], accent: '#bce4fa',
    layout: 'spacious', labelPrefix: '✳ ',
    dark: { bg: '#0b141e', surface: '#101e2b', raised: '#192c3a', text: '#e3f0f6', muted: '#92afc0', accent: '#bce4fa', accentContrast: '#102433', border: '#304b5c' },
    light: { bg: '#e8f1f4', surface: '#f2f8fa', raised: '#ffffff', text: '#203b4c', muted: '#567484', accent: '#39718e', accentContrast: '#ffffff', border: '#b4cdd8' },
    radius: '4px', gap: '28px', font: sans,
    shadow: '0 8px 28px #00000013',
    glow: '0 0 22px color-mix(in srgb, var(--accent) 10%, transparent)', duration: '420ms', ease: 'cubic-bezier(.25,.46,.45,.94)',
    loading: ['·  +  ·', '+  ·  +', '·  ✳  ·', '✳  ·  ✳', '·  +  ·'],
    trail: { gridSize: 56, trailSize: .06, maxAge: 440, interpolate: 4, strength: 2 },
    card: { gap: 11, speed: 18, colors: '#dcf5ff,#aedcef,#7396a8' },
    audio: { wave: 'sine', root: 73.416, chord: [1, 1.4983, 2.2449], click: 1400, decay: .13, filter: 1500 },
  },
];

export const themeById = Object.fromEntries(themes.map(theme => [theme.id, theme])) as Record<ThemeId, ThemeConfig>;

export function themeVariables(theme: ThemeConfig, mode: BrightnessMode): Record<string, string> {
  const p = theme[mode];
  return {
    '--bg': p.bg, '--surface': p.surface, '--surface-raised': p.raised, '--surface-2': p.raised,
    '--fg': p.text, '--text': p.text, '--muted': p.muted, '--accent': p.accent,
    '--accent-contrast': p.accentContrast, '--border': p.border,
    '--shadow': theme.shadow, '--glow': theme.glow, '--radius': theme.radius,
    '--panel-gap': theme.gap, '--font-ui': theme.font, '--sans': theme.font,
    '--font-mono': monoFont, '--mono': monoFont, '--ease': theme.ease, '--duration': theme.duration,
    '--pixel-card-border': p.border, '--pixel-card-active-color': p.surface,
  };
}
