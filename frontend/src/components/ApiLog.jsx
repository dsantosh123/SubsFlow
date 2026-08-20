import { useState } from 'react';
import './ApiLog.css';

export default function ApiLog({ logs, onClear, onTriggerToast }) {
  const [expandedId, setExpandedId] = useState(null);
  const [methodFilter, setMethodFilter] = useState('ALL');

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyCurl = (e, log) => {
    e.stopPropagation();
    const curl = `curl -X ${log.method} "http://localhost:8080${log.url}" -H "Content-Type: application/json"`;
    navigator.clipboard.writeText(curl);
    onTriggerToast?.('info', 'cURL Copied', `Copied ${log.method} command to clipboard.`);
  };

  const filteredLogs = logs.filter((log) => {
    if (methodFilter === 'ALL') return true;
    return log.method === methodFilter;
  });

  return (
    <aside className="api-log glass-panel animate-fade-in">
      <div className="api-log-header">
        <div className="api-log-title-group">
          <span className="log-indicator-dot" />
          <h3 className="api-log-title">Live API Inspector & Telemetry</h3>
          <span className="log-count-badge">{logs.length}</span>
        </div>

        <div className="api-log-actions">
          <div className="log-filter-chips">
            {['ALL', 'GET', 'POST'].map((m) => (
              <button
                key={m}
                className={`log-chip ${methodFilter === m ? 'active' : ''}`}
                onClick={() => setMethodFilter(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <button className="btn-clear-log" onClick={onClear} title="Clear telemetry log">
            Clear
          </button>
        </div>
      </div>

      <div className="api-log-body">
        {filteredLogs.length === 0 ? (
          <div className="api-log-empty">
            <span className="empty-log-icon">📡</span>
            <p>Awaiting API network traffic…</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const is2xx = log.status >= 200 && log.status < 300;
            const is4xx = log.status >= 400 && log.status < 500;
            const is5xx = log.status >= 500;

            const statusClass = is2xx ? 'status-2xx' : is4xx ? 'status-4xx' : is5xx ? 'status-5xx' : 'status-0';

            return (
              <div
                key={log.id}
                className={`log-entry ${isExpanded ? 'log-entry-expanded' : ''}`}
                onClick={() => toggleExpand(log.id)}
              >
                <div className="log-entry-summary">
                  <div className="log-left">
                    <span className={`log-method method-${log.method.toLowerCase()}`}>{log.method}</span>
                    <span className={`log-status ${statusClass}`}>{log.status || 'ERR'}</span>
                    <span className="log-path code-font" title={log.url}>{log.url}</span>
                  </div>

                  <div className="log-right">
                    <span className="log-latency">{log.elapsed}ms</span>
                    <span className="log-time">{log.timestamp}</span>
                    <button
                      className="btn-copy-curl"
                      onClick={(e) => copyCurl(e, log)}
                      title="Copy cURL snippet"
                    >
                      cURL
                    </button>
                  </div>
                </div>

                {isExpanded && log.body && (
                  <div className="log-payload-viewer">
                    <div className="payload-header">
                      <span>Response JSON Payload</span>
                    </div>
                    <pre className="log-body-json">
                      <code>{typeof log.body === 'string' ? log.body : JSON.stringify(log.body, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
