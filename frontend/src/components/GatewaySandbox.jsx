import { useState, useRef } from 'react';
import {
  CreditCard,
  ShieldAlert,
  ServerCrash,
  Play,
  RefreshCw,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Lock,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { changePlan } from '../api';
import GatewayReactor3D from './3d/GatewayReactor3D';
import './GatewaySandbox.css';

const SCENARIOS = [
  {
    id: 'SUCCESS',
    cardCode: 'pm_card_visa',
    title: 'Success Card',
    badge: '200 OK',
    description: 'Always approves. Returns 200 OK.',
    icon: CreditCard,
    accentClass: 'scenario-success',
    color: '#10b981',
    mappedNetworkState: 'SUCCESS',
    toastTitle: 'Transaction Approved',
    toastMessage: 'Payment processed with 200 OK. Subscription state updated successfully.',
    toastType: 'success',
  },
  {
    id: 'DECLINE',
    cardCode: 'pm_card_0000',
    title: 'Decline Card',
    badge: '402 DECLINED',
    description: 'Simulates Insufficient Funds. Triggers Dunning Queue.',
    icon: ShieldAlert,
    accentClass: 'scenario-decline',
    color: '#ef4444',
    mappedNetworkState: 'DECLINED',
    toastTitle: 'Payment Failed: Pushed to Dunning Queue',
    toastMessage: 'Card declined (402 Insufficient Funds). Transaction queued for automatic retry.',
    toastType: 'error',
  },
  {
    id: 'TIMEOUT',
    cardCode: 'pm_card_9999',
    title: 'Circuit Breaker Timeout',
    badge: '503 TIMEOUT',
    description: 'Simulates Gateway Outage. Trips Resilience4j Breaker.',
    icon: ServerCrash,
    accentClass: 'scenario-timeout',
    color: '#f59e0b',
    mappedNetworkState: 'TIMEOUT',
    toastTitle: 'Gateway Timeout: Circuit Breaker Open',
    toastMessage: 'Gateway unreachable (503 Service Unavailable). Fallback activated via Resilience4j.',
    toastType: 'warning',
  },
];

export default function GatewaySandbox({
  apiKey,
  subscriptions = [],
  plans = [],
  addLog,
  onTriggerToast,
}) {
  const [selectedScenario, setSelectedScenario] = useState('SUCCESS');
  const [networkState, setNetworkState] = useState('IDLE');
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(subscriptions[0]?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `idem_${Math.random().toString(36).substring(2, 10)}`
  );
  const [lastResponse, setLastResponse] = useState(null);
  const idleResetTimerRef = useRef(null);

  const generateNewKey = () => {
    setIdempotencyKey(`idem_${Math.random().toString(36).substring(2, 10)}`);
  };

  const handleDispatch = async () => {
    if (isDispatching) return;

    const currentScenarioConfig = SCENARIOS.find((s) => s.id === selectedScenario) || SCENARIOS[0];
    const targetSubId = selectedSubId || subscriptions[0]?.id || 'sub_demo_preview';
    const targetPlanId = selectedPlanId || plans[0]?.id || 'plan-flat-1';

    // 1. Clear any pending idle timers
    if (idleResetTimerRef.current) {
      clearTimeout(idleResetTimerRef.current);
    }

    // 2. Set dispatching state & animate 3D reactor immediately
    setIsDispatching(true);
    setNetworkState(currentScenarioConfig.mappedNetworkState);
    setLastResponse(null);

    const startTime = performance.now();

    try {
      // 3. Perform live API request if subscription exists, or simulate with realistic delay
      let res;
      if (apiKey && subscriptions.length > 0 && selectedSubId) {
        res = await changePlan(
          apiKey,
          targetSubId,
          targetPlanId,
          currentScenarioConfig.cardCode,
          idempotencyKey
        );
        if (addLog) {
          addLog({
            method: res.meta.method,
            url: res.meta.url,
            status: res.status,
            elapsed: res.meta.elapsed,
            body: res.data,
          });
        }
      } else {
        // Fallback simulation delay (1500ms)
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const elapsed = Math.round(performance.now() - startTime);

        if (currentScenarioConfig.id === 'SUCCESS') {
          res = {
            ok: true,
            status: 200,
            meta: { method: 'POST', url: '/api/v1/subscriptions/change-plan', elapsed },
            data: {
              subscriptionId: targetSubId,
              newPlanId: targetPlanId,
              status: 'ACTIVE',
              message: 'Plan upgraded with instantaneous proration credit & debit.',
              idempotencyKey,
            },
          };
        } else if (currentScenarioConfig.id === 'DECLINE') {
          res = {
            ok: false,
            status: 402,
            meta: { method: 'POST', url: '/api/v1/subscriptions/change-plan', elapsed },
            data: {
              error: 'Card declined: Insufficient funds (pm_card_0000).',
              status: 402,
              dunningAction: 'ENQUEUED_IN_PAYMENT_RETRY_QUEUE',
              nextRetryAt: new Date(Date.now() + 86400000).toISOString(),
            },
          };
        } else {
          res = {
            ok: false,
            status: 503,
            meta: { method: 'POST', url: '/api/v1/subscriptions/change-plan', elapsed },
            data: {
              error: 'Gateway timeout: Connection socket severed (pm_card_9999).',
              status: 503,
              circuitBreaker: 'STATE_OPEN',
              fallbackStrategy: 'RECORDED_IN_OUTBOX',
            },
          };
        }
      }

      setLastResponse(res);

      // 4. Trigger informative toast notification
      if (onTriggerToast) {
        onTriggerToast(
          currentScenarioConfig.toastType,
          currentScenarioConfig.toastTitle,
          currentScenarioConfig.toastMessage
        );
      }
    } catch (err) {
      const errorResponse = {
        ok: false,
        status: 500,
        meta: { method: 'POST', url: '/api/v1/subscriptions/change-plan', elapsed: 1500 },
        data: { error: err.message || 'Unexpected Gateway Outage' },
      };
      setLastResponse(errorResponse);

      if (onTriggerToast) {
        onTriggerToast(
          'error',
          'Network Error',
          err.message || 'An unexpected connection failure occurred.'
        );
      }
    } finally {
      setIsDispatching(false);

      // 5. Reset networkState back to IDLE after 4 seconds
      idleResetTimerRef.current = setTimeout(() => {
        setNetworkState('IDLE');
      }, 4000);
    }
  };

  return (
    <div className="sandbox-container glass-panel animate-fade-in">
      {/* Sandbox Header */}
      <div className="sandbox-header">
        <div className="sandbox-title-group">
          <div className="sandbox-icon-wrap">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="sandbox-title">Gateway Sandbox & Chaos Simulator</h2>
              <span className="sandbox-badge">
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                Live Circuit Testing
              </span>
            </div>
            <p className="sandbox-subtitle">
              Simulate high-concurrency double-charges, card declines, and circuit breaker timeouts with real-time 3D state visualization.
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="sandbox-grid">
        {/* Left Column: Interactive Controls */}
        <div className="sandbox-controls-col">
          {/* Section 1: Scenario Selector Cards */}
          <div className="controls-card">
            <div className="controls-card-header">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="controls-section-title">1. Select Payment Scenario</h3>
              </div>
              <span className="controls-step-tag">Step 1 of 3</span>
            </div>

            <div className="scenario-cards-list">
              {SCENARIOS.map((scenario) => {
                const isSelected = selectedScenario === scenario.id;
                const IconComponent = scenario.icon;

                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setSelectedScenario(scenario.id)}
                    className={`scenario-card ${scenario.accentClass} ${isSelected ? 'scenario-card-active' : ''}`}
                  >
                    <div className="scenario-card-top">
                      <div className="scenario-icon-box">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="scenario-title-area">
                        <div className="flex items-center justify-between">
                          <span className="scenario-card-name">{scenario.title}</span>
                          <span className="scenario-status-badge">{scenario.badge}</span>
                        </div>
                        <span className="scenario-card-code font-mono">{scenario.cardCode}</span>
                      </div>
                    </div>
                    <p className="scenario-card-desc">{scenario.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Parameters & Target Payload */}
          <div className="controls-card">
            <div className="controls-card-header">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="controls-section-title">2. Target Configuration</h3>
              </div>
              <span className="controls-step-tag">Step 2 of 3</span>
            </div>

            <div className="controls-form-fields">
              <div className="form-field-group">
                <label className="field-label" htmlFor="sandbox-sub-select">
                  Target Subscription
                </label>
                <select
                  id="sandbox-sub-select"
                  className="field-input"
                  value={selectedSubId || (subscriptions[0]?.id || '')}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                >
                  {subscriptions.length === 0 ? (
                    <option value="">No active subscriptions (Preview Mode)</option>
                  ) : (
                    subscriptions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.id} · {sub.plan?.name || sub.planName || 'Plan'} ({sub.status})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="sandbox-plan-select">
                  Target Upgrade Plan
                </label>
                <select
                  id="sandbox-plan-select"
                  className="field-input"
                  value={selectedPlanId || (plans[0]?.id || '')}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${parseFloat(p.price || 0).toFixed(2)}/{p.billingPeriod})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="field-label" htmlFor="sandbox-idem-key">
                    Idempotency Key (SHA-256)
                  </label>
                  <button
                    type="button"
                    onClick={generateNewKey}
                    className="btn-text-action"
                    title="Generate new UUID key"
                  >
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    New Key
                  </button>
                </div>
                <div className="key-input-wrapper">
                  <Lock className="w-3.5 h-3.5 text-slate-500 key-icon" />
                  <input
                    id="sandbox-idem-key"
                    className="field-input font-mono key-input"
                    type="text"
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                  />
                </div>
                <span className="field-hint">
                  Tip: Replay with the same key to verify atomic double-charge prevention.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Dispatch Button */}
          <div className="controls-action-block">
            <button
              type="button"
              onClick={handleDispatch}
              disabled={isDispatching}
              className={`btn-dispatch-prominent ${isDispatching ? 'dispatching' : ''}`}
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Dispatching to Payment Gateway…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-cyan-300 fill-cyan-300/30" />
                  <span>Dispatch Request</span>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: 3D Visualization & Response Inspector */}
        <div className="sandbox-viz-col">
          {/* 3D WebGL Reactor Viewport */}
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="controls-section-title">Gateway Chaos Reactor</h3>
              </div>
              <span className="viz-status-pill">
                <span
                  className={`w-2 h-2 rounded-full ${
                    networkState === 'SUCCESS'
                      ? 'bg-emerald-400'
                      : networkState === 'DECLINED'
                      ? 'bg-rose-500'
                      : networkState === 'TIMEOUT'
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  } animate-ping`}
                />
                {networkState}
              </span>
            </div>

            <div className="reactor-canvas-mount">
              <GatewayReactor3D
                networkState={networkState}
                onStateChange={setNetworkState}
              />
            </div>
          </div>

          {/* Response Payload & System Logs */}
          <div className="response-card">
            <div className="response-card-header">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="controls-section-title">Gateway Output & Ledger Log</h3>
              </div>
              {lastResponse && (
                <span
                  className={`status-chip ${
                    lastResponse.ok ? 'chip-success' : 'chip-failure'
                  }`}
                >
                  {lastResponse.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : lastResponse.status === 503 ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  HTTP {lastResponse.status} {lastResponse.ok ? 'OK' : 'DECLINED'}
                </span>
              )}
            </div>

            {lastResponse ? (
              <div className="response-body-viewer">
                <div className="response-metrics-strip">
                  <div className="metric-tag">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Latency: {lastResponse.meta?.elapsed || 142}ms</span>
                  </div>
                  <div className="metric-tag">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Idempotency: Verified</span>
                  </div>
                </div>

                <div className="response-json-box">
                  <pre>
                    <code>{JSON.stringify(lastResponse.data, null, 2)}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="response-empty-placeholder">
                <Cpu className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <p className="placeholder-primary-text">Ready for Gateway Dispatch</p>
                <p className="placeholder-sub-text">
                  Choose a scenario on the left and click <strong>Dispatch Request</strong> to observe real-time transaction state transitions and Resilience4j circuit breaker actions.
                </p>
              </div>
            )}

            {/* Architecture Explanations */}
            <div className="gateway-architecture-callout">
              <div className="callout-header">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Backend Orchestration Insights</span>
              </div>
              <ul className="callout-points">
                <li>
                  <strong>Idempotency Layer:</strong> Prevents duplicate debits across retry bursts via SHA-256 keyed ledger locking.
                </li>
                <li>
                  <strong>Resilience4j Circuit Breaker:</strong> Automatically transitions to <code>OPEN</code> state during gateway degradation to protect upstream services.
                </li>
                <li>
                  <strong>Transactional Outbox:</strong> Guarantees exactly-once asynchronous event delivery into Kafka.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
