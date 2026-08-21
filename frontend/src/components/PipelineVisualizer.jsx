import { useState } from 'react';
import PipelineScene3D, { PIPELINE_3D_NODES } from './3d/PipelineScene3D';
import './PipelineVisualizer.css';

export default function PipelineVisualizer({ onTriggerToast }) {
  const [activeStep, setActiveStep] = useState(null);
  const [simulationMode, setSimulationMode] = useState(null); // 'normal' | 'decline' | 'timeout'
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState(PIPELINE_3D_NODES[0]);

  const runSimulation = (mode) => {
    if (simulationRunning) return;
    setSimulationMode(mode);
    setSimulationRunning(true);
    setActiveStep(0);

    const stepInterval = 650; // ms per step

    PIPELINE_3D_NODES.filter(n => !n.isDownstream).forEach((_, idx) => {
      setTimeout(() => {
        setActiveStep(idx);
        setSelectedNode(PIPELINE_3D_NODES[idx]);
      }, idx * stepInterval);
    });

    const totalCoreSteps = PIPELINE_3D_NODES.filter(n => !n.isDownstream).length;
    setTimeout(() => {
      setActiveStep('downstream');
      if (mode === 'normal') {
        setSelectedNode(PIPELINE_3D_NODES.find(n => n.id === 'invoice'));
        onTriggerToast?.('success', 'Pipeline Simulation Complete', 'Payment succeeded and events streamed to Kafka!');
      } else if (mode === 'decline') {
        setSelectedNode(PIPELINE_3D_NODES.find(n => n.id === 'dunning'));
        onTriggerToast?.('warning', 'Dunning Flow Triggered', 'Simulated card decline: Transaction enqueued for retry backoff.');
      } else if (mode === 'timeout') {
        setSelectedNode(PIPELINE_3D_NODES.find(n => n.id === 'engine'));
        onTriggerToast?.('error', 'Circuit Breaker Fallback', 'Gateway timeout simulated: Resilience4j handled fallback gracefully.');
      }
      setTimeout(() => {
        setSimulationRunning(false);
      }, 1400);
    }, totalCoreSteps * stepInterval);
  };

  return (
    <div className="pipeline-visualizer-container animate-fade-in">
      {/* Cockpit Header */}
      <div className="pipeline-header glass-panel">
        <div className="pipeline-title-group">
          <div className="pipeline-badge-icon">⚡</div>
          <div>
            <h2 className="pipeline-title">3D Cyber Architecture & Outbox Pipeline Cockpit</h2>
            <p className="pipeline-subtitle">
              Interactive 3D WebGL representation of SubsFlow's transactional outbox pattern, optimistic locking, and Kafka streaming.
            </p>
          </div>
        </div>

        <div className="pipeline-controls">
          <span className="pipeline-controls-label">Simulate Flow:</span>
          <button
            className="sim-btn sim-btn-success"
            onClick={() => runSimulation('normal')}
            disabled={simulationRunning}
          >
            🟢 Normal Flow (200 OK)
          </button>
          <button
            className="sim-btn sim-btn-warning"
            onClick={() => runSimulation('decline')}
            disabled={simulationRunning}
          >
            🟠 Card Decline (...0000)
          </button>
          <button
            className="sim-btn sim-btn-danger"
            onClick={() => runSimulation('timeout')}
            disabled={simulationRunning}
          >
            🔴 Timeout / Breaker (...9999)
          </button>
        </div>
      </div>

      {/* 3D Visualizer & Inspector Grid */}
      <div className="pipeline-body-grid">
        {/* Left Column: Interactive 3D Canvas Viewport */}
        <div className="pipeline-scene-wrapper">
          <PipelineScene3D
            activeStep={activeStep}
            simulationMode={simulationMode}
            simulationRunning={simulationRunning}
            selectedNode={selectedNode}
            onSelectNode={(node) => setSelectedNode(node)}
          />

          {/* Quick Node Selector Pills */}
          <div className="quick-node-selector glass-panel mt-3 p-3 flex flex-wrap gap-2 items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Quick Focus:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_3D_NODES.map((node) => (
                <button
                  key={node.id}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                    selectedNode?.id === node.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedNode(node)}
                >
                  {node.icon} {node.title.split('. ')[1] || node.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Node Inspector & Architectural Insights */}
        <div className="pipeline-inspector-column">
          <div className="inspector-card glass-panel">
            <div className="inspector-header">
              <span className="inspector-tag">Component Inspector</span>
              <span className="inspector-icon">{selectedNode?.icon || '🔍'}</span>
            </div>

            <h3 className="inspector-node-title">{selectedNode?.title}</h3>
            <p className="inspector-node-sub">{selectedNode?.subtitle}</p>

            <div className="inspector-divider" />

            <div className="inspector-section">
              <h4 className="inspector-section-label">Architecture Role</h4>
              <p className="inspector-desc">{selectedNode?.desc}</p>
            </div>

            <div className="inspector-section">
              <h4 className="inspector-section-label">Key Implementation Highlights</h4>
              <ul className="inspector-highlights">
                <li>
                  <strong>Fault Tolerance:</strong> Zero lost events even during broker outages via PostgreSQL transactional outbox.
                </li>
                <li>
                  <strong>Concurrency Control:</strong> <code>SKIP LOCKED</code> prevents multi-pod worker contention.
                </li>
                <li>
                  <strong>Data Integrity:</strong> Strict idempotency hash checking prevents duplicate double-charges.
                </li>
              </ul>
            </div>

            <div className="inspector-status-box">
              <div className="status-item">
                <span className="status-label">Engine Health</span>
                <span className="status-value status-online">● Optimal</span>
              </div>
              <div className="status-item">
                <span className="status-label">Outbox Queue</span>
                <span className="status-value">0 Pending</span>
              </div>
              <div className="status-item">
                <span className="status-label">Circuit State</span>
                <span className="status-value">CLOSED (Normal)</span>
              </div>
            </div>
          </div>

          <div className="legend-card glass-panel">
            <h4 className="legend-title">Pipeline Legend & Stream Nodes</h4>
            <div className="legend-items">
              <div className="legend-row">
                <span className="legend-dot dot-core" />
                <span className="legend-label">Core Transactional Path (Synchronous)</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot dot-resilience" />
                <span className="legend-label">Resilience4j Circuit Breaker & Retry</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot dot-async" />
                <span className="legend-label">Async Outbox & Kafka Streaming</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot dot-dunning" />
                <span className="legend-label">Dunning & Failure Recovery Path</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
