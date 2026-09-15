'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { Color, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';
import { fragmentShader, vertexShader } from './pixel-snow-shaders';
import { animateWhileVisible } from './animation';
import './effects.css';

export interface PixelSnowProps {
  color?: string; flakeSize?: number; minFlakeSize?: number; pixelResolution?: number;
  speed?: number; depthFade?: number; farPlane?: number; brightness?: number;
  gamma?: number; density?: number; variant?: 'square' | 'round' | 'snowflake';
  direction?: number; className?: string; style?: CSSProperties; onError?: () => void;
}

/** Supplied React Bits PixelSnow with a bounded DPR and complete lifecycle cleanup. */
export default function PixelSnow({ color = '#ffffff', flakeSize = .01, minFlakeSize = 1.25,
  pixelResolution = 200, speed = 1.25, depthFade = 8, farPlane = 20, brightness = 1,
  gamma = .4545, density = .3, variant = 'square', direction = 125,
  className = '', style, onError }: PixelSnowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power', stencil: false, depth: false });
    } catch { onError?.(); return; }
    renderer.debug.onShaderError = () => onError?.();
    // Snow is intentionally rendered at CSS resolution: its shader performs pixelation.
    renderer.setPixelRatio(1);
    renderer.setClearColor(0, 0);
    container.appendChild(renderer.domElement);
    const material = new ShaderMaterial({ vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false, uniforms: {
      uTime: { value: 0 }, uResolution: { value: new Vector2() }, uFlakeSize: { value: flakeSize },
      uMinFlakeSize: { value: minFlakeSize }, uPixelResolution: { value: pixelResolution },
      uSpeed: { value: speed }, uDepthFade: { value: depthFade }, uFarPlane: { value: farPlane },
      uColor: { value: new Color(color) }, uBrightness: { value: brightness }, uGamma: { value: gamma },
      uDensity: { value: density }, uVariant: { value: variant === 'round' ? 1 : variant === 'snowflake' ? 2 : 0 },
      uDirection: { value: direction * Math.PI / 180 },
    } });
    const geometry = new PlaneGeometry(2, 2);
    const scene = new Scene();
    scene.add(new Mesh(geometry, material));
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width, height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const contextLost = (event: Event) => { event.preventDefault(); onError?.(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const stop = animateWhileVisible(container, seconds => {
      material.uniforms.uTime.value = seconds;
      renderer.render(scene, camera);
    }, onError);
    return () => {
      stop(); observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      geometry.dispose(); material.dispose(); scene.clear();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [color, flakeSize, minFlakeSize, pixelResolution, speed, depthFade, farPlane, brightness, gamma, density, variant, direction, onError]);
  return <div ref={containerRef} className={`rb-pixel-environment ${className}`} style={style} aria-hidden="true" />;
}
