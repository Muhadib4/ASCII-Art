'use client';
import { useEffect, useRef } from 'react';
import { usePreferences } from '@/features/themes/store';

type Point = { x: number; y: number; z: number; nx: number; ny: number; nz: number };
function makeSculpture(): Point[] {
  const points: Point[] = [];
  const center = (t: number) => [(2 + 0.65 * Math.cos(3 * t)) * Math.cos(2 * t), (2 + 0.65 * Math.cos(3 * t)) * Math.sin(2 * t), 0.8 * Math.sin(3 * t)];
  for (let i = 0; i < 240; i++) {
    const t = i / 240 * Math.PI * 2;
    const p = center(t), q = center(t + 0.001);
    const tangent = q.map((value, j) => value - p[j]);
    const length = Math.hypot(...tangent);
    const [tx, ty, tz] = tangent.map(value => value / length);
    const nl = Math.hypot(tx, ty);
    const [nx, ny] = [-ty / nl, tx / nl];
    const [bx, by, bz] = [-tz * ny, tz * nx, tx * ny - ty * nx];
    for (let j = 0; j < 48; j++) {
      const a = j / 48 * Math.PI * 2;
      const [dx, dy, dz] = [nx * Math.cos(a) + bx * Math.sin(a), ny * Math.cos(a) + by * Math.sin(a), bz * Math.sin(a)];
      points.push({ x: p[0] + dx * 0.58, y: p[1] + dy * 0.58, z: p[2] + dz * 0.58, nx: dx, ny: dy, nz: dz });
    }
  }
  return points;
}

export default function AsciiSculpture({ density = 1, comparison = 0, paused = false }: { density?: number; comparison?: number; paused?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme, mode, effects } = usePreferences();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const points = makeSculpture();
    const cols = Math.round(106 * density), rows = Math.round(65 * density);
    const width = 660, height = 510, cw = width / cols, ch = height / rows;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.scale(dpr, dpr);
    const depth = new Float32Array(cols * rows), light = new Float32Array(cols * rows);
    const ramp = ' .,:;+=xX#%@';
    const themeColors = { mono: ['#deded7', '#353533'], terminal: ['#b4f7a5', '#2f6634'], neon: ['#d1b7ff', '#634b8d'], winter: ['#dbf2ff', '#4d7689'] };
    const [foreground, low] = mode === 'light' ? ['#292b29', '#b0b2ae'] : themeColors[theme];
    let frame = 0, last = 0, visible = true, angle = 0.12;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const draw = () => {
      depth.fill(-Infinity); light.fill(0);
      const ax = 0.72, ay = angle, az = -0.28;
      const rotate = (x: number, y: number, z: number) => {
        const yy = y * Math.cos(ax) - z * Math.sin(ax), zz = y * Math.sin(ax) + z * Math.cos(ax);
        const xx = x * Math.cos(ay) + zz * Math.sin(ay), zzz = -x * Math.sin(ay) + zz * Math.cos(ay);
        return [xx * Math.cos(az) - yy * Math.sin(az), xx * Math.sin(az) + yy * Math.cos(az), zzz];
      };
      for (const p of points) {
        const [x, y, z] = rotate(p.x, p.y, p.z);
        const [nx, ny, nz] = rotate(p.nx, p.ny, p.nz);
        const perspective = 7.5 / (7.5 - z);
        const px = Math.floor(cols / 2 + x * cols * 0.121 * perspective);
        const py = Math.floor(rows / 2 - y * rows * 0.155 * perspective);
        if (px < 0 || px >= cols || py < 0 || py >= rows) continue;
        const idx = py * cols + px;
        if (z > depth[idx]) { depth[idx] = z; light[idx] = Math.max(0.06, Math.min(1, (-nx * 0.42 + ny * 0.56 + nz * 0.66) * 0.7 + 0.35)); }
      }
      context.clearRect(0, 0, width, height);
      context.font = `${Math.max(5, cw * 1.13)}px 'IBM Plex Mono', monospace`;
      context.textBaseline = 'middle';
      context.textAlign = 'center';
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        if (depth[idx] === -Infinity) continue;
        const l = light[idx];
        context.globalAlpha = 0.18 + l * 0.82;
        context.fillStyle = l > 0.25 ? foreground : low;
        if (x / cols < comparison) context.fillRect(x * cw, y * ch, cw + 0.4, ch + 0.4);
        else context.fillText(ramp[Math.min(ramp.length - 1, Math.floor(l * ramp.length))], x * cw, y * ch);
      }
      context.globalAlpha = 1;
    };
    const animate = (time: number) => {
      if (time - last > 70 && visible && !document.hidden && effects && !motion.matches && !paused) { angle += 0.008; draw(); last = time; }
      frame = requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
    observer.observe(canvas);
    draw();
    if (!paused && effects && !motion.matches) frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [theme, mode, effects, density, comparison, paused]);
  return <canvas ref={ref} className="sculpture-canvas" aria-label="A three-dimensional trefoil sculpture rendered in ASCII characters, slowly rotating" role="img" />;
}
