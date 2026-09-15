'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { themeById } from '@/features/themes/config';
import { usePreferences } from '@/features/themes/store';
import './effects.css';

/** React Bits' supplied radial appear/disappear and shimmer pixel algorithm. */
class Pixel {
  size = 0;
  sizeStep = Math.random() * .4;
  minSize = .5;
  maxSizeInteger = 2;
  maxSize = Math.random() * 1.5 + .5;
  counter = 0;
  isIdle = false;
  isReverse = false;
  isShimmer = false;
  speed: number;
  counterStep: number;
  constructor(private ctx: CanvasRenderingContext2D, private x: number, private y: number,
    private color: string, speed: number, private delay: number, width: number, height: number) {
    this.speed = (Math.random() * .8 + .1) * speed;
    this.counterStep = Math.random() * 4 + (width + height) * .01;
  }
  draw() {
    const offset = this.maxSizeInteger * .5 - this.size * .5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + offset, this.y + offset, this.size, this.size);
  }
  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) { this.counter += this.counterStep; return; }
    if (this.size >= this.maxSize) this.isShimmer = true;
    if (this.isShimmer) this.shimmer(); else this.size += this.sizeStep;
    this.draw();
  }
  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) { this.isIdle = true; return; }
    this.size -= .1;
    this.draw();
  }
  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true;
    else if (this.size <= this.minSize) this.isReverse = false;
    this.size += this.isReverse ? -this.speed : this.speed;
  }
}

const variants = {
  default: { gap: 5, speed: 35, colors: '#f8fafc,#f1f5f9,#cbd5e1' },
  blue: { gap: 10, speed: 25, colors: '#e0f2fe,#7dd3fc,#0ea5e9' },
  yellow: { gap: 3, speed: 20, colors: '#fef08a,#fde047,#eab308' },
  pink: { gap: 6, speed: 80, colors: '#fecdd3,#fda4af,#e11d48' },
};
export interface PixelCardProps {
  variant?: keyof typeof variants; gap?: number; speed?: number; colors?: string;
  noFocus?: boolean; className?: string; children?: ReactNode; style?: CSSProperties;
}

export default function PixelCard({ variant, gap, speed, colors, noFocus = false, className = '', children, style }: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = usePreferences(state => state.theme);
  const enabled = usePreferences(state => state.effects);
  const config = variant ? variants[variant] : themeById[theme].card;
  const finalGap = gap ?? config.gap;
  const finalSpeed = speed ?? config.speed;
  const finalColors = colors ?? config.colors;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = matchMedia('(hover: none)');
    let pixels: Pixel[] = [];
    let frame = 0;
    let previous = 0;
    let inView = false;
    let hovered = false;
    let focused = false;
    let direction: 'appear' | 'disappear' = 'disappear';
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const allowed = () => enabled && !reduced.matches && !document.hidden && inView;
    const draw = (now: number) => {
      frame = 0;
      if (!allowed()) return;
      if (now - previous >= 1000 / 45) {
        previous = now;
        context.clearRect(0, 0, canvas.width, canvas.height);
        pixels.forEach(pixel => pixel[direction]());
      }
      if (pixels.some(pixel => !pixel.isIdle)) frame = requestAnimationFrame(draw);
    };
    const sync = () => {
      stop();
      direction = hovered || focused ? 'appear' : 'disappear';
      if (allowed() && (hovered || focused || pixels.some(pixel => !pixel.isIdle))) frame = requestAnimationFrame(draw);
      if (!enabled || reduced.matches) context.clearRect(0, 0, canvas.width, canvas.height);
    };
    const init = () => {
      canvas.width = Math.floor(container.clientWidth);
      canvas.height = Math.floor(container.clientHeight);
      pixels = [];
      if (!enabled || reduced.matches) return;
      const palette = finalColors.split(',').map(color => color.trim()).filter(Boolean);
      // Maintain the supplied pixel spacing while capping unusually large surfaces.
      const spacing = Math.max(4, Math.round(finalGap), Math.ceil(Math.sqrt(canvas.width * canvas.height / 5000)));
      for (let x = 0; x < canvas.width; x += spacing) for (let y = 0; y < canvas.height; y += spacing) {
        const delay = Math.hypot(x - canvas.width / 2, y - canvas.height / 2);
        const pixel = new Pixel(context, x, y, palette[Math.floor(Math.random() * palette.length)] || '#ffffff', Math.min(100, Math.max(0, finalSpeed)) * .001, delay, canvas.width, canvas.height);
        pixel.isIdle = true;
        pixels.push(pixel);
      }
      sync();
    };
    const enter = () => { if (!coarse.matches) { hovered = true; sync(); } };
    const leave = () => { hovered = false; sync(); };
    const focus = () => { if (!noFocus) { focused = true; sync(); } };
    const blur = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && container.contains(event.relatedTarget)) return;
      focused = false; sync();
    };
    const visibility = () => { if (document.hidden) hovered = false; sync(); };
    const resizeObserver = new ResizeObserver(init);
    const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    resizeObserver.observe(container); intersection.observe(container); init();
    container.addEventListener('pointerenter', enter);
    container.addEventListener('pointerleave', leave);
    container.addEventListener('focusin', focus);
    container.addEventListener('focusout', blur);
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', init);
    return () => {
      stop(); resizeObserver.disconnect(); intersection.disconnect();
      container.removeEventListener('pointerenter', enter); container.removeEventListener('pointerleave', leave);
      container.removeEventListener('focusin', focus); container.removeEventListener('focusout', blur);
      document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', init);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled, finalGap, finalSpeed, finalColors, noFocus]);
  // Children own their semantics/focus; a decorative card does not add a duplicate tab stop.
  return <div className={`pixel-card ${className}`} ref={containerRef} style={style}>
    <canvas className="rb-pixel-card-canvas" ref={canvasRef} aria-hidden="true" />{children}
  </div>;
}
