import './ApiLog.css';

function statusColor(status) {
  if (status >= 200 && status < 300) return 'color-success';
  if (status >= 400 && status < 500) return 'color-warning';
  if (status >= 500) return 'color-error';
  return '';
}

export default function ApiLog({ logs, onClear }) {
  return (
    <div className="api-log glass">
      <div className="api-log-header">
        <h2 className="section-title">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          API Request Log
        </h2>
        <div className="api-log-actions">
          <span className="log-count">{logs.length} request{logs.length !== 1 && 's'}</span>
          <button className="btn-clear" onClick={onClear} disabled={logs.length === 0}>Clear</button>
        </div>
      </div>

      <div className="api-log-body">
        {logs.length === 0 ? (
          <div className="log-empty">No API requests made yet. Action logs will appear here.</div>
        ) : (
          <div className="log-entries">
            {logs.map((log) => (
              <div key={log.id} className="log-entry">
                <div className="log-entry-meta">
                  <span className="log-time">{log.timestamp}</span>
                  <span className={`log-method ${log.method.toLowerCase()}`}>{log.method}</span>
                  <span className="log-url">{log.url}</span>
                  <span className="log-spacer" />
                  {log.idempotencyKey && (
                    <span className="log-idem" title="Idempotency Key">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      {log.idempotencyKey}
                    </span>
                  )}
                  <span className={`log-status ${statusColor(log.status)}`}>{log.status}</span>
                  <span className="log-elapsed">{log.elapsed}ms</span>
                </div>
                <div className="log-entry-body">
                  <pre>{JSON.stringify(log.body, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
