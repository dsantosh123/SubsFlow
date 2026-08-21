import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// ── Node 3D Coordinates & Meta Configuration ──────────────────
export const PIPELINE_3D_NODES = [
  {
    id: 'gateway',
    title: '1. API Gateway',
    subtitle: 'Idempotency Key validation & Auth Filter',
    type: 'core',
    icon: '🌐',
    badge: 'X-Tenant-ID & Key',
    desc: 'Extracts client tenant identifier and routes request to idempotency validation filter.',
    position: [-4.2, 2.2, 0],
    color: '#06b6d4',
    geometry: 'box'
  },
  {
    id: 'idempotency',
    title: '2. Idempotency Check',
    subtitle: 'idempotency_keys table, SHA-256 hash',
    type: 'core',
    icon: '🔒',
    badge: 'SHA-256 Lock',
    desc: 'Verifies hash integrity and ensures concurrent duplicate requests return cached results safely.',
    position: [-1.4, 2.2, 0],
    color: '#6366f1',
    geometry: 'cylinder'
  },
  {
    id: 'subscription',
    title: '3. Subscription Engine',
    subtitle: 'Optimistic locking via @Version',
    type: 'core',
    icon: '📝',
    badge: '@Version 0 → 1',
    desc: 'Calculates billing periods, plans, and applies optimistic lock to prevent race conditions.',
    position: [1.4, 2.2, 0],
    color: '#8b5cf6',
    geometry: 'octahedron'
  },
  {
    id: 'engine',
    title: '4. Resilience4j Payment Engine',
    subtitle: 'Proration + Circuit Breaker & Retry',
    type: 'resilience',
    icon: '🛡️',
    badge: 'Resilience4j Wrapper',
    desc: 'Executes proration calculation and calls payment gateway client protected by Circuit Breaker.',
    position: [4.2, 2.2, 0],
    color: '#10b981',
    geometry: 'torus'
  },
  {
    id: 'postgres',
    title: '5. PostgreSQL Atomic DB',
    subtitle: 'Atomic state update + outbox_events insert',
    type: 'database',
    icon: '🗄️',
    badge: 'ACID Transaction',
    desc: 'Persists Invoice, PaymentTransaction, Subscription state, and OutboxEvent atomically.',
    position: [3.2, -0.4, 0],
    color: '#10b981',
    geometry: 'cylinder'
  },
  {
    id: 'outbox',
    title: '6. Outbox Relay Poller',
    subtitle: 'FOR UPDATE SKIP LOCKED Poller',
    type: 'async',
    icon: '📬',
    badge: 'SKIP LOCKED',
    desc: 'Concurrent background workers safely dequeue pending events without table-level blocking.',
    position: [0.0, -0.4, 0],
    color: '#f59e0b',
    geometry: 'box'
  },
  {
    id: 'kafka',
    title: '7. Kafka Message Broker',
    subtitle: 'Topic: subscription-events & payment.*',
    type: 'async',
    icon: '⚡',
    badge: 'Event Streaming',
    desc: 'Fans out events to multiple downstream microservices with at-least-once delivery guarantee.',
    position: [-3.2, -0.4, 0],
    color: '#06b6d4',
    geometry: 'sphere'
  },
  // Downstream Fanout Nodes
  {
    id: 'invoice',
    title: 'Invoice Service',
    subtitle: 'Generates PDF & Ledger line items',
    type: 'async',
    icon: '🧾',
    badge: 'LEDGER',
    desc: 'Asynchronously generates PDF invoices and records dual-entry financial ledger entries.',
    position: [-4.2, -2.6, 0],
    color: '#06b6d4',
    geometry: 'box',
    isDownstream: true
  },
  {
    id: 'notification',
    title: 'Notification Service',
    subtitle: 'Alerts tenant via Webhook / Email',
    type: 'async',
    icon: '🔔',
    badge: 'WEBHOOK',
    desc: 'Dispatches real-time webhooks, emails, and tenant notifications on state change.',
    position: [-1.4, -2.6, 0],
    color: '#6366f1',
    geometry: 'box',
    isDownstream: true
  },
  {
    id: 'dunning',
    title: 'Dunning Service',
    subtitle: 'Exponential Retry Queue (1m, 3m, 7m)',
    type: 'dunning',
    icon: '⚠️',
    badge: 'RETRY QUEUE',
    desc: 'Scheduled exponential dunning retries. Suspends subscription upon final decline.',
    position: [1.4, -2.6, 0],
    color: '#f43f5e',
    geometry: 'box',
    isDownstream: true
  }
];

// ── 3D Node Mesh Component ─────────────────────────────────────
function PipelineNode3D({ node, index, isActive, isSelected, onSelect, simulationMode }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Idle subtle rotation
    meshRef.current.rotation.y += delta * (isActive ? 2.5 : 0.8);
    if (node.geometry === 'torus' || node.geometry === 'octahedron') {
      meshRef.current.rotation.x += delta * 0.5;
    }

    // Active pulse scale
    const targetScale = isSelected ? 1.25 : hovered ? 1.15 : isActive ? 1.1 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10);
  });

  const nodeColor = useMemo(() => {
    if (simulationMode === 'decline' && (node.id === 'dunning' || isActive)) return '#f43f5e';
    if (simulationMode === 'timeout' && (node.id === 'engine' || isActive)) return '#f59e0b';
    if (isActive) return '#38bdf8';
    return node.color;
  }, [isActive, simulationMode, node.id, node.color]);

  return (
    <group position={node.position}>
      {/* Interactive Mesh */}
      <Float speed={isActive ? 3 : 1.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
        >
          {node.geometry === 'box' && <boxGeometry args={[1.1, 0.7, 0.7]} />}
          {node.geometry === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 0.8, 24]} />}
          {node.geometry === 'octahedron' && <octahedronGeometry args={[0.6, 0]} />}
          {node.geometry === 'torus' && <torusGeometry args={[0.45, 0.18, 16, 32]} />}
          {node.geometry === 'sphere' && <sphereGeometry args={[0.55, 32, 32]} />}

          <meshStandardMaterial
            color={nodeColor}
            emissive={nodeColor}
            emissiveIntensity={isActive ? 1.4 : isSelected || hovered ? 0.8 : 0.25}
            roughness={0.2}
            metalness={0.8}
            wireframe={hovered || isSelected}
          />
        </mesh>

        {/* Pulsing Beacon Ring for Active State */}
        {isActive && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.95, 32]} />
            <meshBasicMaterial color={nodeColor} transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        )}
      </Float>

      {/* Holographic 3D HTML Label */}
      <Html
        position={[0, -0.75, 0]}
        center
        distanceFactor={11}
        className="pointer-events-none select-none"
      >
        <div
          className={`flex flex-col items-center px-2.5 py-1 rounded-lg backdrop-blur-md transition-all duration-300 ${
            isSelected
              ? 'bg-slate-900/90 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
              : isActive
              ? 'bg-slate-900/85 border border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
              : 'bg-slate-950/70 border border-slate-800/80 hover:border-slate-700'
          }`}
          style={{ width: 'max-content' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{node.icon}</span>
            <span className="text-[11px] font-bold font-mono text-slate-100 whitespace-nowrap">
              {node.title}
            </span>
          </div>
          <span className="text-[9px] font-mono text-cyan-400/90 font-medium">
            {node.badge}
          </span>
        </div>
      </Html>
    </group>
  );
}

// ── Glowing Laser Spline Cable ─────────────────────────────────
function SplineCable({ start, end, active, color = '#6366f1' }) {
  const lineMesh = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const midVec = new THREE.Vector3(
      (startVec.x + endVec.x) / 2,
      (startVec.y + endVec.y) / 2 + (start[1] === end[1] ? 0.3 : 0),
      0
    );

    const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
    const points = curve.getPoints(30);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [start, end]);

  return (
    <primitive object={new THREE.Line(
      lineMesh,
      new THREE.LineBasicMaterial({
        color: active ? '#06b6d4' : color,
        linewidth: 2,
        transparent: true,
        opacity: active ? 0.9 : 0.35,
      })
    )} />
  );
}

// ── Data Particle Packets Moving Along Splines ───────────────────
function FlowingDataParticles({ activeStep, simulationRunning }) {
  const particlesRef = useRef([]);

  const paths = useMemo(() => {
    return [
      { from: [-4.2, 2.2, 0], to: [-1.4, 2.2, 0] },
      { from: [-1.4, 2.2, 0], to: [1.4, 2.2, 0] },
      { from: [1.4, 2.2, 0], to: [4.2, 2.2, 0] },
      { from: [4.2, 2.2, 0], to: [3.2, -0.4, 0] },
      { from: [3.2, -0.4, 0], to: [0.0, -0.4, 0] },
      { from: [0.0, -0.4, 0], to: [-3.2, -0.4, 0] },
      // Fanout paths
      { from: [-3.2, -0.4, 0], to: [-4.2, -2.6, 0] },
      { from: [-3.2, -0.4, 0], to: [-1.4, -2.6, 0] },
      { from: [-3.2, -0.4, 0], to: [1.4, -2.6, 0] },
    ];
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const speed = simulationRunning ? 3.5 : 1.2;

    particlesRef.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const path = paths[idx % paths.length];
      const progress = ((time * speed * 0.3 + (idx * 0.25)) % 1);
      mesh.position.x = path.from[0] + (path.to[0] - path.from[0]) * progress;
      mesh.position.y = path.from[1] + (path.to[1] - path.from[1]) * progress;
      mesh.position.z = Math.sin(progress * Math.PI) * 0.3;
    });
  });

  return (
    <group>
      {paths.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (particlesRef.current[i] = el)}
        >
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}
    </group>
  );
}

// ── Cyber Coordinate Grid Ground ───────────────────────────────
function CyberGrid() {
  return (
    <group position={[0, -3.8, -1]}>
      <gridHelper args={[24, 24, '#6366f1', '#1e293b']} position={[0, 0, 0]} rotation={[0, 0, 0]} />
    </group>
  );
}

// ── Main Pipeline 3D Scene Export ──────────────────────────────
export default function PipelineScene3D({
  activeStep,
  simulationMode,
  simulationRunning,
  selectedNode,
  onSelectNode
}) {
  const controlsRef = useRef();

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800/80 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      {/* Interactive Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#06b6d4" />
        <pointLight position={[-10, -10, -5]} intensity={1.2} color="#6366f1" />
        <spotLight position={[0, 8, 8]} angle={0.6} penumbra={0.8} intensity={2} color="#ffffff" />

        {/* Coordinate Grid Floor */}
        <CyberGrid />

        {/* 3D Spline Cables */}
        <SplineCable start={[-4.2, 2.2, 0]} end={[-1.4, 2.2, 0]} active={activeStep >= 1} color="#6366f1" />
        <SplineCable start={[-1.4, 2.2, 0]} end={[1.4, 2.2, 0]} active={activeStep >= 2} color="#8b5cf6" />
        <SplineCable start={[1.4, 2.2, 0]} end={[4.2, 2.2, 0]} active={activeStep >= 3} color="#10b981" />
        <SplineCable start={[4.2, 2.2, 0]} end={[3.2, -0.4, 0]} active={activeStep >= 4} color="#10b981" />
        <SplineCable start={[3.2, -0.4, 0]} end={[0.0, -0.4, 0]} active={activeStep >= 5} color="#f59e0b" />
        <SplineCable start={[0.0, -0.4, 0]} end={[-3.2, -0.4, 0]} active={activeStep >= 6} color="#06b6d4" />
        {/* Downstream Fanout Cables */}
        <SplineCable start={[-3.2, -0.4, 0]} end={[-4.2, -2.6, 0]} active={activeStep === 'downstream'} color="#06b6d4" />
        <SplineCable start={[-3.2, -0.4, 0]} end={[-1.4, -2.6, 0]} active={activeStep === 'downstream'} color="#6366f1" />
        <SplineCable start={[-3.2, -0.4, 0]} end={[1.4, -2.6, 0]} active={activeStep === 'downstream'} color="#f43f5e" />

        {/* Flowing Laser Data Packets */}
        <FlowingDataParticles activeStep={activeStep} simulationRunning={simulationRunning} />

        {/* 3D Pipeline Node Meshes */}
        {PIPELINE_3D_NODES.map((node, idx) => (
          <PipelineNode3D
            key={node.id}
            node={node}
            index={idx}
            isActive={
              activeStep === idx ||
              (activeStep === 'downstream' && node.isDownstream)
            }
            isSelected={selectedNode?.id === node.id}
            onSelect={onSelectNode}
            simulationMode={simulationMode}
          />
        ))}

        {/* Camera Interaction */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          minDistance={5}
          maxDistance={14}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 3.2}
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Cyber HUD Overlay Badges */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${simulationRunning ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
          <span className="text-[11px] font-mono font-bold text-slate-200">
            {simulationRunning ? 'DATA STREAM ACTIVE' : '3D SPATIAL ENGINE IDLE'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800/80">
          Rotate / Zoom: Drag & Scroll
        </span>
      </div>

      {/* Camera Reset Button */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <button
          className="px-2.5 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-[11px] font-mono text-cyan-400 border border-slate-800 hover:border-cyan-500/40 transition-all backdrop-blur-md"
          onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.reset();
            }
          }}
        >
          ↺ Reset View
        </button>
      </div>

      {/* Selected Node Status Footer Tag */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-3 py-1 rounded-lg backdrop-blur-md pointer-events-none">
          <span className="text-xs">{selectedNode.icon}</span>
          <span className="text-[11px] font-mono font-bold text-slate-200">
            {selectedNode.title}
          </span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            ONLINE
          </span>
        </div>
      )}
    </div>
  );
}
