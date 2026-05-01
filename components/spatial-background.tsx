"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 2200;

const vertexShader = `
uniform float uTime;
uniform vec2 uPointer;
attribute float aScale;
attribute float aPhase;
varying float vDepth;
varying float vPhase;

void main() {
  vec3 p = position;
  float t = uTime * 0.18;
  float breath = sin(t + aPhase) * 0.08;
  float ripple = sin((p.x * 2.1) + (p.y * 1.4) + t * 2.5 + aPhase) * 0.12;

  p.x += uPointer.x * (0.34 + aScale * 0.18) + ripple;
  p.y += uPointer.y * (0.24 + aScale * 0.14) + breath;
  p.z += sin(t * 1.7 + length(p.xy) * 1.9 + aPhase) * 0.18;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vDepth = clamp((-mvPosition.z - 1.0) / 7.5, 0.0, 1.0);
  vPhase = aPhase;
  gl_PointSize = (1.6 + aScale * 2.8) * (10.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
varying float vDepth;
varying float vPhase;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.5, 0.02, d);
  float halo = smoothstep(0.5, 0.18, d) * 0.35;
  float mixWave = 0.5 + 0.5 * sin(uTime * 0.35 + vPhase);
  vec3 color = mix(uColorA, uColorB, mixWave);
  color = mix(color, uColorC, vDepth * 0.72);
  gl_FragColor = vec4(color, (core + halo) * (0.28 + vDepth * 0.78));
}
`;

export function SpatialBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 7.6);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const layer = index / PARTICLE_COUNT;
      const radius = 2.1 + Math.sin(layer * Math.PI * 4) * 0.52 + layer * 2.8;
      const y = 1 - (index / (PARTICLE_COUNT - 1)) * 2;
      const radial = Math.sqrt(1 - y * y);
      const theta = index * golden;
      const spiral = theta + Math.sin(layer * 10) * 0.7;

      positions[index * 3] = Math.cos(spiral) * radial * radius * 1.48;
      positions[index * 3 + 1] = y * radius * 0.86 + Math.sin(theta * 0.19) * 0.22;
      positions[index * 3 + 2] = Math.sin(spiral) * radial * radius - 2.4 + layer * 1.1;
      scales[index] = 0.22 + Math.random() * 1.35;
      phases[index] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: new THREE.Color("#5DB8FF") },
      uColorB: { value: new THREE.Color("#FF8A5C") },
      uColorC: { value: new THREE.Color("#A3E635") },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.set(-0.12, -0.36, 0.04);
    scene.add(points);

    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);
    const startTime = performance.now();
    let frame = 0;

    function onPointerMove(event: PointerEvent) {
      targetPointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      targetPointer.y = -(event.clientY / window.innerHeight - 0.5) * 2;
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      frame = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;
      pointer.lerp(targetPointer, 0.045);
      uniforms.uTime.value = elapsed;
      uniforms.uPointer.value.copy(pointer);
      points.rotation.y = -0.36 + elapsed * 0.018 + pointer.x * 0.06;
      points.rotation.x = -0.12 + pointer.y * 0.035;
      renderer.render(scene, camera);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onResize);
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="spatial-canvas"
      data-spatial-canvas="true"
      ref={canvasRef}
    />
  );
}
