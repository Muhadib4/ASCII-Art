'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import * as THREE from 'three';
import { Effect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import { createLiquidEffect, createTouchTexture, FRAGMENT_SRC, SHAPE_MAP, VERTEX_SRC } from './pixel-blast-shaders';
import { animateWhileVisible } from './animation';
import './effects.css';

export interface PixelBlastProps {
  variant?: keyof typeof SHAPE_MAP; pixelSize?: number; color?: string;
  className?: string; style?: CSSProperties; antialias?: boolean;
  patternScale?: number; patternDensity?: number; liquid?: boolean;
  liquidStrength?: number; liquidRadius?: number; liquidWobbleSpeed?: number;
  pixelSizeJitter?: number; enableRipples?: boolean; rippleIntensityScale?: number;
  rippleThickness?: number; rippleSpeed?: number; autoPauseOffscreen?: boolean;
  speed?: number; transparent?: boolean; edgeFade?: number; noiseAmount?: number; onError?: () => void;
}

/** Original React Bits pixel field, click ripples, and optional liquid postprocessing. */
export default function PixelBlast({ variant = 'square', pixelSize = 3, color = '#B497CF',
  className = '', style, antialias = false, patternScale = 2, patternDensity = 1,
  liquid = false, liquidStrength = .1, liquidRadius = 1, liquidWobbleSpeed = 4.5,
  pixelSizeJitter = 0, enableRipples = true, rippleIntensityScale = 1,
  rippleThickness = .1, rippleSpeed = .3, speed = .5, transparent = true,
  edgeFade = .5, noiseAmount = 0, onError }: PixelBlastProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias, alpha: true, powerPreference: 'low-power' }); }
    catch { onError?.(); return; }
    renderer.debug.onShaderError = () => onError?.();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setClearColor(0, transparent ? 0 : 1);
    container.appendChild(renderer.domElement);
    const uniforms = {
      uResolution: { value: new THREE.Vector2() }, uTime: { value: 0 }, uColor: { value: new THREE.Color(color) },
      uClickPos: { value: Array.from({ length: 10 }, () => new THREE.Vector2(-1, -1)) },
      uClickTimes: { value: new Float32Array(10) }, uShapeType: { value: SHAPE_MAP[variant] },
      uPixelSize: { value: pixelSize * renderer.getPixelRatio() }, uScale: { value: patternScale },
      uDensity: { value: patternDensity }, uPixelJitter: { value: pixelSizeJitter },
      uEnableRipples: { value: enableRipples ? 1 : 0 }, uRippleSpeed: { value: rippleSpeed },
      uRippleThickness: { value: rippleThickness }, uRippleIntensity: { value: rippleIntensityScale }, uEdgeFade: { value: edgeFade },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: VERTEX_SRC, fragmentShader: FRAGMENT_SRC,
      uniforms, transparent: true, depthTest: false, depthWrite: false, glslVersion: THREE.GLSL3 });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const touch = liquid ? createTouchTexture() : null;
    if (touch) touch.radiusScale = liquidRadius;
    const postEffects: Effect[] = [];
    if (touch) postEffects.push(createLiquidEffect(touch.texture, { strength: liquidStrength, freq: liquidWobbleSpeed }));
    if (noiseAmount > 0) postEffects.push(new Effect('NoiseEffect',
      `uniform float uTime; uniform float uAmount; float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); } void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){ float n=hash(floor(uv*vec2(1920.,1080.))+floor(uTime*60.)); outputColor=inputColor+vec4(vec3((n-.5)*uAmount),0.); }`,
      { uniforms: new Map([['uTime', new THREE.Uniform(0)], ['uAmount', new THREE.Uniform(noiseAmount)]]) }));
    const composer = postEffects.length ? new EffectComposer(renderer, { multisampling: 0 }) : null;
    if (composer) {
      composer.addPass(new RenderPass(scene, camera));
      const pass = new EffectPass(camera, ...postEffects);
      pass.renderToScreen = true;
      composer.addPass(pass);
    }
    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
      composer?.setSize(width, height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    let clickIndex = 0;
    const position = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null;
      return { x: (event.clientX - rect.left) / rect.width, y: 1 - (event.clientY - rect.top) / rect.height };
    };
    // Listen passively outside the canvas so every link/control remains clickable.
    const pointerDown = (event: PointerEvent) => {
      const pos = position(event);
      if (!pos || !enableRipples) return;
      uniforms.uClickPos.value[clickIndex].set(pos.x * renderer.domElement.width, pos.y * renderer.domElement.height);
      uniforms.uClickTimes.value[clickIndex] = uniforms.uTime.value;
      clickIndex = (clickIndex + 1) % 10;
    };
    const pointerMove = (event: PointerEvent) => {
      const pos = position(event);
      if (pos && event.pointerType !== 'touch') touch?.addTouch(pos);
    };
    document.addEventListener('pointerdown', pointerDown, { passive: true });
    if (touch) document.addEventListener('pointermove', pointerMove, { passive: true });
    const contextLost = (event: Event) => { event.preventDefault(); onError?.(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const stop = animateWhileVisible(container, seconds => {
      uniforms.uTime.value = 100 + seconds * speed;
      touch?.update();
      postEffects.forEach(effect => { const uniform = effect.uniforms.get('uTime'); if (uniform) uniform.value = uniforms.uTime.value; });
      if (composer) composer.render(); else renderer.render(scene, camera);
    }, onError);
    return () => {
      stop(); observer.disconnect();
      document.removeEventListener('pointerdown', pointerDown);
      document.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      composer?.dispose(); touch?.texture.dispose(); geometry.dispose(); material.dispose(); scene.clear();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [variant, pixelSize, color, antialias, patternScale, patternDensity, liquid, liquidStrength, liquidRadius,
    liquidWobbleSpeed, pixelSizeJitter, enableRipples, rippleIntensityScale, rippleThickness, rippleSpeed,
    speed, transparent, edgeFade, noiseAmount, onError]);
  return <div ref={containerRef} className={`rb-pixel-environment ${className}`} style={style} aria-hidden="true" />;
}
