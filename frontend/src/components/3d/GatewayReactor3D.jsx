import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// ── State Color & Configuration Mapping ──────────────────────────────
const STATE_CONFIG = {
  IDLE: {
    color: '#06b6d4',
    emissive: '#0891b2',
    ambientColor: '#083344',
    lightIntensity: 2.2,
    baseScale: 1.0,
    speed: 1.0,
    label: 'GATEWAY_IDLE',
    statusText: 'STANDBY // READY',
    code: 'READY',
  },
  SUCCESS: {
    color: '#10b981',
    emissive: '#059669',
    ambientColor: '#064e3b',
    lightIntensity: 4.5,
    baseScale: 1.28,
    speed: 2.5,
    label: 'TRANSACTION_SUCCESS',
    statusText: '200 OK // SETTLED',
    code: '200_OK',
  },
  DECLINED: {
    color: '#ef4444',
    emissive: '#dc2626',
    ambientColor: '#450a0a',
    lightIntensity: 3.8,
    baseScale: 0.88,
    speed: 4.0,
    label: 'PAYMENT_DECLINED',
    statusText: '402 // INSUFFICIENT_FUNDS',
    code: '402_DECLINED',
  },
  TIMEOUT: {
    color: '#f59e0b',
    emissive: '#d97706',
    ambientColor: '#451a03',
    lightIntensity: 3.5,
    baseScale: 1.12,
    speed: 0.5,
    label: 'CIRCUIT_BREAKER_OPEN',
    statusText: '503 // TIMEOUT_FALLBACK',
    code: '503_TIMEOUT',
  },
};

// ── Floating Energy Particles ────────────────────────────────────────
function ReactorParticles({ count = 45, stateKey = 'IDLE' }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const config = STATE_CONFIG[stateKey] || STATE_CONFIG.IDLE;

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      arr.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        speed: 0.4 + Math.random() * 0.8,
        size: 0.02 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const isGlitch = stateKey === 'TIMEOUT';
    const isDecline = stateKey === 'DECLINED';

    particles.forEach((p, i) => {
      let speedMult = stateKey === 'SUCCESS' ? 2.5 : 1.0;
      let angle = time * p.speed * 0.5 * speedMult + p.phase;
      let r = 2.0 + Math.sin(time * p.speed + p.phase) * 0.4;

      let px = Math.cos(angle) * r;
      let py = p.y + Math.sin(time * 1.5 + p.phase) * 0.2;
      let pz = Math.sin(angle) * r;

      if (isDecline) {
        px += (Math.random() - 0.5) * 0.15;
        py += (Math.random() - 0.5) * 0.15;
      }
      if (isGlitch && Math.random() > 0.85) {
        px *= 1.3;
        pz *= 1.3;
      }

      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(p.size * (1 + Math.sin(time * 3 + p.phase) * 0.3));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        color={config.color}
        transparent
        opacity={stateKey === 'DECLINED' ? 0.9 : 0.65}
      />
    </instancedMesh>
  );
}

// ── Reactor Gimbal Rings ─────────────────────────────────────────────
function GimbalRings({ stateKey = 'IDLE' }) {
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const config = STATE_CONFIG[stateKey] || STATE_CONFIG.IDLE;

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const isDecline = stateKey === 'DECLINED';
    const isGlitch = stateKey === 'TIMEOUT';
    const isSuccess = stateKey === 'SUCCESS';

    if (ring1Ref.current) {
      if (isGlitch) {
        // Stuttering discrete steps
        ring1Ref.current.rotation.x = Math.floor(time * 3) * 0.6;
        ring1Ref.current.rotation.y += delta * 0.2;
      } else if (isDecline) {
        ring1Ref.current.rotation.x += delta * 4.0;
        ring1Ref.current.rotation.y += delta * 3.0;
      } else if (isSuccess) {
        ring1Ref.current.rotation.x += delta * 3.2;
        ring1Ref.current.rotation.y += delta * 2.4;
      } else {
        ring1Ref.current.rotation.x += delta * 0.6;
        ring1Ref.current.rotation.y += delta * 0.8;
      }
    }

    if (ring2Ref.current) {
      if (isGlitch) {
        ring2Ref.current.rotation.y = Math.floor(time * 4) * 0.4;
        ring2Ref.current.rotation.z += delta * 0.3;
      } else if (isDecline) {
        ring2Ref.current.rotation.y -= delta * 3.5;
        ring2Ref.current.rotation.z += delta * 2.5;
      } else if (isSuccess) {
        ring2Ref.current.rotation.y -= delta * 2.8;
        ring2Ref.current.rotation.z += delta * 2.0;
      } else {
        ring2Ref.current.rotation.y -= delta * 0.7;
        ring2Ref.current.rotation.z += delta * 0.5;
      }
    }

    if (ring3Ref.current) {
      if (isGlitch) {
        ring3Ref.current.rotation.z = Math.sin(Math.floor(time * 5)) * 1.5;
      } else {
        ring3Ref.current.rotation.z += delta * (isSuccess ? 1.8 : 0.4);
      }
    }
  });

  return (
    <group>
      {/* Outer Ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.75, 0.02, 16, 64]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={stateKey === 'SUCCESS' ? 1.8 : 0.8}
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Mid Ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <torusGeometry args={[1.5, 0.018, 16, 64]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={stateKey === 'SUCCESS' ? 1.5 : 0.6}
          roughness={0.3}
          metalness={0.85}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Inner Equatorial Ring 3 */}
      <mesh ref={ring3Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.28, 0.015, 16, 64]} />
        <meshBasicMaterial
          color={config.color}
          wireframe
          transparent
          opacity={stateKey === 'TIMEOUT' ? 0.35 : 0.6}
        />
      </mesh>
    </group>
  );
}

// ── Core Reactor Orb ─────────────────────────────────────────────────
function ReactorOrb({ stateKey = 'IDLE' }) {
  const coreMeshRef = useRef();
  const wireMeshRef = useRef();
  const innerGlowRef = useRef();
  const groupRef = useRef();

  const config = STATE_CONFIG[stateKey] || STATE_CONFIG.IDLE;

  // Target values for smooth lerping
  const targetScale = useRef(config.baseScale);
  const colorLerp = useRef(new THREE.Color(config.color));
  const emissiveLerp = useRef(new THREE.Color(config.emissive));

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    targetScale.current = config.baseScale;

    // Smooth color lerp
    colorLerp.current.lerp(new THREE.Color(config.color), delta * 5);
    emissiveLerp.current.lerp(new THREE.Color(config.emissive), delta * 5);

    if (groupRef.current) {
      // 1. STATE: IDLE -> Slow majestic rotation
      if (stateKey === 'IDLE') {
        groupRef.current.position.set(0, 0, 0);
        groupRef.current.rotation.y += delta * 0.45;
        groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.15;
        const breathScale = 1.0 + Math.sin(time * 1.8) * 0.035;
        groupRef.current.scale.lerp(new THREE.Vector3(breathScale, breathScale, breathScale), delta * 4);
      }

      // 2. STATE: SUCCESS -> Expands slightly, solidifies, heartbeat pulse
      else if (stateKey === 'SUCCESS') {
        groupRef.current.position.set(0, 0, 0);
        groupRef.current.rotation.y += delta * 1.5;
        groupRef.current.rotation.x += delta * 0.6;
        // Rapid heartbeat double-pulse
        const beat = (Math.sin(time * 8) * 0.5 + 0.5) ** 4 * 0.18;
        const s = targetScale.current + beat;
        groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 8);
      }

      // 3. STATE: DECLINED -> Contracts rapidly, violent high-frequency vibration
      else if (stateKey === 'DECLINED') {
        const shakeIntensity = 0.07;
        groupRef.current.position.x = (Math.random() - 0.5) * shakeIntensity;
        groupRef.current.position.y = (Math.random() - 0.5) * shakeIntensity;
        groupRef.current.position.z = (Math.random() - 0.5) * shakeIntensity;
        groupRef.current.rotation.y += delta * 2.8;
        groupRef.current.rotation.z += (Math.random() - 0.5) * 0.2;

        const shudder = targetScale.current + Math.sin(time * 30) * 0.05;
        groupRef.current.scale.lerp(new THREE.Vector3(shudder, shudder, shudder), delta * 12);
      }

      // 4. STATE: TIMEOUT -> Erratic scaling, glitch stutter & rotation jumping
      else if (stateKey === 'TIMEOUT') {
        const glitchStep = Math.floor(time * 6);
        const isSpike = Math.sin(glitchStep * 13.3) > 0.65;

        groupRef.current.position.x = isSpike ? (Math.random() - 0.5) * 0.12 : 0;
        groupRef.current.position.y = isSpike ? (Math.random() - 0.5) * 0.12 : 0;
        groupRef.current.position.z = 0;

        groupRef.current.rotation.y = Math.floor(time * 3) * 0.4;
        groupRef.current.rotation.x = Math.sin(glitchStep) * 0.3;

        const erraticScale = targetScale.current * (isSpike ? 1.25 : (1.0 + Math.sin(time * 12) * 0.08));
        groupRef.current.scale.lerp(new THREE.Vector3(erraticScale, erraticScale, erraticScale), delta * 10);
      }
    }

    // Update Core Material
    if (coreMeshRef.current) {
      coreMeshRef.current.material.color.copy(colorLerp.current);
      coreMeshRef.current.material.emissive.copy(emissiveLerp.current);
      coreMeshRef.current.material.emissiveIntensity =
        stateKey === 'SUCCESS' ? 2.5 + Math.sin(time * 8) * 0.8 :
        stateKey === 'TIMEOUT' ? (Math.random() > 0.3 ? 1.8 : 0.4) :
        stateKey === 'DECLINED' ? 2.0 : 0.9;
    }

    // Update Wireframe Shell
    if (wireMeshRef.current) {
      wireMeshRef.current.rotation.y -= delta * 0.6;
      wireMeshRef.current.rotation.z += delta * 0.3;
      wireMeshRef.current.material.color.copy(colorLerp.current);

      if (stateKey === 'TIMEOUT') {
        wireMeshRef.current.material.opacity = Math.random() > 0.4 ? 0.8 : 0.15;
      } else {
        wireMeshRef.current.material.opacity = stateKey === 'SUCCESS' ? 0.7 : 0.5;
      }
    }

    // Update Inner Nucleus Glow
    if (innerGlowRef.current) {
      innerGlowRef.current.rotation.x += delta * 1.2;
      innerGlowRef.current.rotation.y += delta * 1.0;
      innerGlowRef.current.material.color.copy(emissiveLerp.current);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Solid Core */}
      <mesh ref={coreMeshRef}>
        <icosahedronGeometry args={[0.9, 3]} />
        <meshStandardMaterial
          roughness={0.15}
          metalness={0.85}
          transparent
          opacity={stateKey === 'SUCCESS' ? 0.95 : 0.82}
        />
      </mesh>

      {/* Outer Wireframe Cage */}
      <mesh ref={wireMeshRef} scale={[1.16, 1.16, 1.16]}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Inner Glowing Nucleus */}
      <mesh ref={innerGlowRef} scale={[0.52, 0.52, 0.52]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

// ── Holographic Base Scanner Grid ────────────────────────────────────
function HolographicBase({ stateKey = 'IDLE' }) {
  const baseRef = useRef();
  const config = STATE_CONFIG[stateKey] || STATE_CONFIG.IDLE;

  useFrame((state, delta) => {
    if (baseRef.current) {
      baseRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer Concentric Projection Ring */}
      <mesh ref={baseRef}>
        <ringGeometry args={[1.5, 1.54, 32]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner Projection Ring */}
      <mesh>
        <ringGeometry args={[0.9, 0.92, 32]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Main Scene Canvas Wrapper ────────────────────────────────────────
function ReactorScene({ networkState = 'IDLE' }) {
  const config = STATE_CONFIG[networkState] || STATE_CONFIG.IDLE;

  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 4, 15]} />

      {/* Dynamic Lighting System */}
      <ambientLight intensity={0.25} color={config.ambientColor} />
      <directionalLight position={[5, 6, 4]} intensity={0.8} color="#ffffff" />
      <pointLight
        position={[0, 0, 0]}
        color={config.color}
        intensity={config.lightIntensity}
        distance={8}
        decay={2}
      />
      <pointLight
        position={[0, 2.5, 2]}
        color={config.emissive}
        intensity={config.lightIntensity * 0.6}
        distance={6}
        decay={2}
      />

      {/* Orbit Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={networkState === 'IDLE'}
        autoRotateSpeed={1.5}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 2.8}
      />

      {/* Float Container for Organic Hovering */}
      <Float speed={networkState === 'SUCCESS' ? 3.0 : 1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <ReactorOrb stateKey={networkState} />
        <GimbalRings stateKey={networkState} />
        <ReactorParticles count={40} stateKey={networkState} />
      </Float>

      <HolographicBase stateKey={networkState} />
    </>
  );
}

// ── Exported Component ───────────────────────────────────────────────
export default function GatewayReactor3D({ networkState = 'IDLE', onStateChange = null }) {
  const normalizedState = STATE_CONFIG[networkState] ? networkState : 'IDLE';
  const currentConfig = STATE_CONFIG[normalizedState];

  return (
    <div className="gateway-reactor-wrapper relative w-full h-80 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_30px_rgba(3,7,18,0.9)] flex flex-col justify-between select-none">
      {/* Cyberpunk Top Status Bar HUD */}
      <div className="reactor-hud-header flex items-center justify-between px-4 py-2.5 z-10 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: currentConfig.color }}
          />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            {currentConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border"
            style={{
              color: currentConfig.color,
              borderColor: `${currentConfig.color}40`,
              backgroundColor: `${currentConfig.color}15`,
              boxShadow: `0 0 10px ${currentConfig.color}25`,
            }}
          >
            {currentConfig.statusText}
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="reactor-canvas-container flex-1 w-full relative">
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 48, near: 0.1, far: 50 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
        >
          <ReactorScene networkState={normalizedState} />
        </Canvas>

        {/* Ambient Corner Decals */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500 pointer-events-none">
          SYS::REACTOR_V4
        </div>
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-500 pointer-events-none">
          ORBIT_STABILIZER: ACTIVE
        </div>
      </div>

      {/* Interactive Quick State Selector Bar (Optional Debug/Manual Control) */}
      {onStateChange && (
        <div className="reactor-hud-footer flex items-center justify-center gap-1.5 p-2 z-10 bg-slate-900/80 border-t border-slate-800/80">
          {Object.keys(STATE_CONFIG).map((key) => {
            const isSelected = normalizedState === key;
            const btnColor = STATE_CONFIG[key].color;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onStateChange(key)}
                className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded transition-all duration-200 ${
                  isSelected
                    ? 'text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800'
                }`}
                style={{
                  backgroundColor: isSelected ? `${btnColor}30` : undefined,
                  borderColor: isSelected ? btnColor : 'transparent',
                  borderWidth: '1px',
                  boxShadow: isSelected ? `0 0 12px ${btnColor}40` : undefined,
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
