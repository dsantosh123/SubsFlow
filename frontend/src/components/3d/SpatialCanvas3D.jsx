import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────
   InfiniteGrid — A procedural neon grid plane
   ───────────────────────────────────────────────────────── */
function InfiniteGrid() {
  const meshRef = useRef();

  const gridShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#6366f1') },
      uFade: { value: 8.0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uFade;
      varying vec3 vWorldPos;

      float grid(vec2 st, float res) {
        vec2 grid = abs(fract(st * res - 0.5) - 0.5) / fwidth(st * res);
        return 1.0 - min(min(grid.x, grid.y), 1.0);
      }

      void main() {
        float d = length(vWorldPos.xz);
        float fadeOut = 1.0 - smoothstep(0.0, uFade, d);

        float g1 = grid(vWorldPos.xz, 0.5) * 0.4;
        float g2 = grid(vWorldPos.xz, 2.0) * 0.15;

        float scanLine = smoothstep(0.48, 0.5,
          fract(vWorldPos.z * 0.15 - uTime * 0.08)
        ) * 0.12;

        float alpha = (g1 + g2 + scanLine) * fadeOut;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, -1.5, 0]}>
      <planeGeometry args={[40, 40, 1, 1]} />
      <shaderMaterial {...gridShader} />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────────
   ParticleField — Instanced floating particle cloud
   ───────────────────────────────────────────────────────── */
function ParticleField({ count = 150 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 20,
        ],
        speed: 0.002 + Math.random() * 0.008,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        scale: 0.02 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      const yFloat = Math.sin(time * p.speed * 20 + p.phase) * 0.3;
      dummy.position.set(p.position[0], p.position[1] + yFloat, p.position[2]);
      dummy.rotation.x = time * p.rotationSpeed;
      dummy.rotation.y = time * p.rotationSpeed * 1.3;
      dummy.scale.setScalar(p.scale * (1 + Math.sin(time * 0.5 + p.phase) * 0.3));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#818cf8"
        emissive="#6366f1"
        emissiveIntensity={0.6}
        roughness={0.3}
        metalness={0.8}
        transparent
        opacity={0.7}
      />
    </instancedMesh>
  );
}

/* ─────────────────────────────────────────────────────────
   ReactiveLight — Mouse-following point light
   ───────────────────────────────────────────────────────── */
function ReactiveLight() {
  const lightRef = useRef();
  const { viewport } = useThree();

  useFrame((state) => {
    if (!lightRef.current) return;
    const { x, y } = state.pointer;
    lightRef.current.position.x = (x * viewport.width) / 2;
    lightRef.current.position.y = (y * viewport.height) / 2 + 2;
    lightRef.current.position.z = 4;
  });

  return (
    <pointLight
      ref={lightRef}
      color="#a5b4fc"
      intensity={1.2}
      distance={18}
      decay={2}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   SpatialCanvas3D — Main exported component
   ───────────────────────────────────────────────────────── */
export default function SpatialCanvas3D() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 3, 8], fov: 55, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 8, 30]} />

        {/* Ambient fill lighting */}
        <ambientLight intensity={0.15} />
        <hemisphereLight
          color="#6366f1"
          groundColor="#030712"
          intensity={0.25}
        />

        {/* Static accent lights */}
        <pointLight position={[-6, 4, -6]} color="#06b6d4" intensity={0.5} distance={20} decay={2} />
        <pointLight position={[6, 3, 4]} color="#6366f1" intensity={0.4} distance={18} decay={2} />

        {/* Dynamic mouse-following light */}
        <ReactiveLight />

        {/* Scene elements */}
        <InfiniteGrid />
        <ParticleField count={150} />
      </Canvas>
    </div>
  );
}
