import { useState, useEffect } from 'react';
import './PipelineVisualizer.css';

const PIPELINE_NODES = [
  {
    id: 'gateway',
    title: '1. API Gateway',
    subtitle: 'Idempotency Key validation & Auth Filter',
    type: 'core',
    icon: '🌐',
    badge: 'X-Tenant-ID & Key',
    desc: 'Extracts client tenant identifier and routes request to idempotency validation filter.'
  },
  {
    id: 'idempotency',
    title: '2. Idempotency Check',
    subtitle: 'idempotency_keys table, SHA-256 hash',
    type: 'core',
    icon: '🔒',
    badge: 'SHA-256 Lock',
    desc: 'Verifies hash integrity and ensures concurrent duplicate requests return cached results safely.'
  },
  {
    id: 'subscription',
    title: '3. Subscription Service',
    subtitle: 'Optimistic locking via @Version',
    type: 'core',
    icon: '📝',
    badge: '@Version 0 → 1',
    desc: 'Calculates billing periods, plans, and applies optimistic lock to prevent race conditions.'
  },
  {
    id: 'engine',
    title: '4. Resilience4j Payment Engine',
    subtitle: 'Proration + Circuit Breaker & Retry',
    type: 'resilience',
    icon: '🛡️',
    badge: 'Resilience4j Wrapper',
    desc: 'Executes proration calculation and calls payment gateway client protected by Circuit Breaker.'
  },
  {
    id: 'postgres',
    title: '5. PostgreSQL Atomic DB',
    subtitle: 'Atomic state update + outbox_events insert',
    type: 'database',
    icon: '🗄️',
    badge: 'ACID Transaction',
    desc: 'Persists Invoice, PaymentTransaction, Subscription state, and OutboxEvent atomically.'
  },
  {
    id: 'outbox',
    title: '6. Outbox Relay Poller',
    subtitle: 'FOR UPDATE SKIP LOCKED Poller',
    type: 'async',
    icon: '📬',
    badge: 'SKIP LOCKED',
    desc: 'Concurrent background workers safely dequeue pending events without table-level blocking.'
  },
  {
    id: 'kafka',
    title: '7. Kafka Message Broker',
    subtitle: 'Topic: subscription-events & payment.*',
    type: 'async',
    icon: '⚡',
    badge: 'Event Streaming',
    desc: 'Fans out events to multiple downstream microservices with at-least-once delivery guarantee.'
  }
];

const DOWNSTREAM_SERVICES = [
  {
    id: 'invoice',
    title: 'Invoice Service',
    subtitle: 'Generates PDF & Ledger line items',
    icon: '🧾',
    type: 'async'
  },
  {
    id: 'notification',
    title: 'Notification Service',
    subtitle: 'Alerts tenant via Webhook / Email',
    icon: '🔔',
    type: 'async'
  },
  {
    id: 'dunning',
    title: 'Dunning Service',
    subtitle: 'Exponential Retry Queue (1m, 3m, 7m)',
    icon: '⚠️',
    type: 'dunning'
  }
];

export default function PipelineVisualizer({ onTriggerToast }) {
  const [activeStep, setActiveStep] = useState(null);
  const [simulationMode, setSimulationMode] = useState(null); // 'normal' | 'decline' | 'timeout'
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState(PIPELINE_NODES[0]);

  const runSimulation = (mode) => {
    if (simulationRunning) return;
    setSimulationMode(mode);
    setSimulationRunning(true);
    setActiveStep(0);

    const stepInterval = 650; // ms per step

    PIPELINE_NODES.forEach((_, idx) => {
      setTimeout(() => {
        setActiveStep(idx);
        setSelectedNode(PIPELINE_NODES[idx]);
      }, idx * stepInterval);
    });

    const totalSteps = PIPELINE_NODES.length;
    setTimeout(() => {
      setActiveStep('downstream');
      if (mode === 'normal') {
        onTriggerToast?.('success', 'Pipeline Simulation Complete', 'Payment succeeded and events streamed to Kafka!');
      } else if (mode === 'decline') {
        onTriggerToast?.('warning', 'Dunning Flow Triggered', 'Simulated card decline: Transaction enqueued for retry backoff.');
      } else if (mode === 'timeout') {
        onTriggerToast?.('error', 'Circuit Breaker Fallback', 'Gateway timeout simulated: Resilience4j handled fallback gracefully.');
      }
      setTimeout(() => {
        setSimulationRunning(false);
      }, 1200);
    }, totalSteps * stepInterval);
  };

  return (
    <div className="pipeline-visualizer-container animate-fade-in">
      <div className="pipeline-header glass-panel">
        <div className="pipeline-title-group">
          <div className="pipeline-badge-icon">⚡</div>
          <div>
            <h2 className="pipeline-title">Live Architecture & Outbox Pipeline Visualizer</h2>
            <p className="pipeline-subtitle">
              Real-time representation of SubsFlow's transactional outbox pattern, optimistic locking, and Kafka streaming.
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

      <div className="pipeline-body-grid">
        {/* Left Column: Visual Pipeline Flow */}
        <div className="pipeline-flow-column glass-panel">
          <div className="pipeline-nodes-stack">
            {PIPELINE_NODES.map((node, index) => {
              const isActive = activeStep === index;
              const isPassed = typeof activeStep === 'number' && activeStep > index;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div key={node.id} className="pipeline-node-wrapper">
                  <div
                    className={`pipeline-node node-${node.type} ${isActive ? 'node-active' : ''} ${isPassed ? 'node-passed' : ''} ${isSelected ? 'node-selected' : ''}`}
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="node-icon">{node.icon}</div>
                    <div className="node-info">
                      <div className="node-header-row">
                        <span className="node-title">{node.title}</span>
                        <span className="node-badge">{node.badge}</span>
                      </div>
                      <span className="node-subtitle">{node.subtitle}</span>
                    </div>
                    {isActive && <div className="node-pulse-ring" />}
                  </div>

                  {index < PIPELINE_NODES.length - 1 && (
                    <div className={`pipeline-connector ${isPassed ? 'connector-active' : ''}`}>
                      <div className="connector-line" />
                      <div className="connector-arrow">▼</div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Downstream Fanout Indicator */}
            <div className={`pipeline-connector ${activeStep === 'downstream' ? 'connector-active' : ''}`}>
              <div className="connector-line" />
              <div className="connector-arrow">▼ Kafka Fanout Consumer Group</div>
            </div>

            {/* Downstream Services Row */}
            <div className="downstream-services-grid">
              {DOWNSTREAM_SERVICES.map((svc) => (
                <div
                  key={svc.id}
                  className={`downstream-card downstream-${svc.type} ${activeStep === 'downstream' ? 'downstream-active' : ''}`}
                  onClick={() => setSelectedNode({
                    title: svc.title,
                    subtitle: svc.subtitle,
                    badge: svc.type.toUpperCase(),
                    icon: svc.icon,
                    desc: `Asynchronous subscriber listening on Kafka topics for tenant billing and orchestration.`
                  })}
                >
                  <div className="downstream-icon">{svc.icon}</div>
                  <h4 className="downstream-title">{svc.title}</h4>
                  <p className="downstream-subtitle">{svc.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Failure / Dunning State */}
            <div className="dunning-loop-card">
              <div className="dunning-loop-header">
                <span className="dunning-tag">Failure Path</span>
                <span className="dunning-title">PAST_DUE → SUSPENDED</span>
              </div>
              <p className="dunning-desc">
                If all 3 retry attempts fail, Dunning scheduler transitions subscription to SUSPENDED and publishes a new Outbox Event.
              </p>
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
            <h4 className="legend-title">Pipeline Legend</h4>
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
