'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { shaderMaterial, useTrailTexture } from '@react-three/drei';
import * as THREE from 'three';
import './effects.css';

// React Bits' supplied shaderMaterial/useTrailTexture implementation.
const DotMaterial = shaderMaterial({ resolution: new THREE.Vector2(), mouseTrail: null, gridSize: 100, pixelColor: new THREE.Color('#ffffff') },
  `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  `uniform vec2 resolution;
   uniform sampler2D mouseTrail;
   uniform float gridSize;
   uniform vec3 pixelColor;
   vec2 coverUv(vec2 uv) {
     vec2 s = resolution.xy / max(resolution.x, resolution.y);
     return clamp((uv - .5) * s + .5, 0.0, 1.0);
   }
   void main() {
     vec2 uv = coverUv(gl_FragCoord.xy / resolution);
     vec2 gridUvCenter = (floor(uv * gridSize) + .5) / gridSize;
     float trail = texture2D(mouseTrail, gridUvCenter).r;
     gl_FragColor = vec4(pixelColor, trail);
   }`);

const identityEase = (value: number) => value;
export interface PixelTrailProps {
  gridSize?: number; trailSize?: number; maxAge?: number; interpolate?: number;
  easingFunction?: (value: number) => number; color?: string; className?: string;
  gooeyFilter?: { id: string; strength: number }; onError?: () => void;
}
type SceneProps = Required<Pick<PixelTrailProps, 'gridSize' | 'trailSize' | 'maxAge' | 'interpolate' | 'easingFunction' | 'color'>> & Pick<PixelTrailProps, 'onError'>;

function Scene({ gridSize, trailSize, maxAge, interpolate, easingFunction, color, onError }: SceneProps) {
  const gl = useThree(state => state.gl);
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);
  const lastMoved = useRef(0);
  const material = useMemo(() => new DotMaterial(), []);
  const [trail, onMove] = useTrailTexture({ size: 256, radius: trailSize, maxAge, interpolate, ease: easingFunction });
  useEffect(() => {
    material.transparent = true;
    material.depthTest = false;
    material.depthWrite = false;
    return () => material.dispose();
  }, [material]);
  useEffect(() => {
    trail.minFilter = THREE.NearestFilter;
    trail.magFilter = THREE.NearestFilter;
    trail.wrapS = trail.wrapT = THREE.ClampToEdgeWrapping;
    material.uniforms.mouseTrail.value = trail;
    material.uniforms.gridSize.value = gridSize;
    material.uniforms.pixelColor.value.set(color);
    material.uniforms.resolution.value.set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio());
    invalidate();
  }, [material, trail, gridSize, color, size.width, size.height, gl, invalidate]);
  useEffect(() => () => trail.dispose(), [trail]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || document.hidden) return;
      const rect = gl.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      const maxDimension = Math.max(rect.width, rect.height);
      // Match the supplied shader's coverUv, including non-square hero regions.
      const uv = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width - .5) * rect.width / maxDimension + .5,
        (.5 - (event.clientY - rect.top) / rect.height) * rect.height / maxDimension + .5,
      );
      onMove({ uv } as ThreeEvent<PointerEvent>);
      lastMoved.current = performance.now();
      invalidate();
    };
    const lost = (event: Event) => { event.preventDefault(); onError?.(); };
    document.addEventListener('pointermove', move, { passive: true });
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      document.removeEventListener('pointermove', move);
      gl.domElement.removeEventListener('webglcontextlost', lost);
    };
  }, [gl, onMove, invalidate, onError]);
  useFrame(() => { if (!document.hidden && performance.now() - lastMoved.current < maxAge + 120) invalidate(); });
  return <mesh><planeGeometry args={[2, 2]} /><primitive object={material} attach="material" /></mesh>;
}

export default function PixelTrail({ gridSize = 40, trailSize = .1, maxAge = 250, interpolate = 5,
  easingFunction = identityEase, color = '#ffffff', className = '', gooeyFilter, onError }: PixelTrailProps) {
  return <div className={`rb-trail-container ${className}`} aria-hidden="true">
    {gooeyFilter && <svg className="rb-goo-filter" aria-hidden="true"><defs><filter id={gooeyFilter.id}>
      <feGaussianBlur in="SourceGraphic" stdDeviation={gooeyFilter.strength} result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
      <feComposite in="SourceGraphic" in2="goo" operator="atop" />
    </filter></defs></svg>}
    <Canvas dpr={[1, 1.25]} frameloop="demand" gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      fallback={<div className="studio-effects-fallback" />} style={{ pointerEvents: 'none', ...(gooeyFilter ? { filter: `url(#${gooeyFilter.id})` } : {}) }}>
      <Scene gridSize={gridSize} trailSize={trailSize} maxAge={maxAge} interpolate={interpolate} easingFunction={easingFunction} color={color} onError={onError} />
    </Canvas>
  </div>;
}
