import { useMemo } from 'react';

export function createStudy(kind: 'sphere' | 'landscape' | 'wave' | 'flower' | 'type', cols = 60, rows = 27): string {
  const ramp = ' .:-=+*#%@';
  const out: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const u = (x / cols - 0.5) * 2.2, v = (y / rows - 0.5) * 2.2;
      let shade = 0;
      if (kind === 'sphere') {
        const rr = u * u + v * v;
        if (rr < 0.77) shade = Math.max(0.06, (-u + -v + Math.sqrt(0.77 - rr)) * 0.65);
      } else if (kind === 'landscape') {
        const mountain = -0.33 + Math.sin(u * 3.8) * 0.23 + Math.sin(u * 9) * 0.12;
        if (v > mountain) shade = Math.max(0.1, (0.95 - v) * (0.45 + Math.sin(x * 1.34 + y * 0.71) * 0.31));
        if ((u - 0.58) ** 2 + (v + 0.55) ** 2 < 0.026) shade = 0.95;
      } else if (kind === 'wave') {
        const a = Math.sin(u * 4 + v * 1.5) * 0.32;
        shade = Math.max(0, 1 - Math.abs(v - a) * 2) * (0.28 + (Math.sin(u * 16 + v * 28) + 1) * 0.28);
      } else if (kind === 'flower') {
        const r = Math.hypot(u, v), a = Math.atan2(v, u);
        const edge = 0.48 + Math.cos(a * 6 + r * 3) * 0.28;
        if (r < edge) shade = 0.25 + (Math.sin(a * 6 + r * 19) + 1) * 0.34;
      } else {
        const px = Math.floor(x / 4), py = Math.floor(y / 4);
        shade = ((px + py) % 3 === 0 && py > 0 && py < 6) ? 0.85 : 0;
      }
      line += ramp[Math.min(ramp.length - 1, Math.max(0, Math.floor(shade * ramp.length)))];
    }
    out.push(line);
  }
  return out.join('\n');
}

export default function AsciiStudy({ kind = 'sphere', className = '' }: { kind?: Parameters<typeof createStudy>[0]; className?: string }) {
  const art = useMemo(() => createStudy(kind), [kind]);
  return <pre className={`ascii-study ${className}`} aria-hidden="true">{art}</pre>;
}
