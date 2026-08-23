import { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, RefreshCw, ArrowRight } from 'lucide-react';
import { listTenants } from '../../adminApi';
import TiltCard3D from '../3d/TiltCard3D';
import AdminTenantDetail from './AdminTenantDetail';
import './AdminTenantsPage.css';

export default function AdminTenantsPage({
  addLog,
  onTriggerToast,
  selectedTenantId,
  onClearSelectedTenant,
}) {
  // If selectedTenantId is provided, render the Detail view instead of the list
  if (selectedTenantId) {
    return (
      <AdminTenantDetail
        tenantId={selectedTenantId}
        onBack={onClearSelectedTenant}
        addLog={addLog}
        onTriggerToast={onTriggerToast}
      />
    );
  }

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); // '' | 'ACTIVE' | 'SUSPENDED'
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('DESC');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const searchTimeoutRef = useRef(null);

  const fetchTenants = async (currentSearch = search) => {
    setLoading(true);
    const res = await listTenants({
      search: currentSearch,
      status,
      page,
      size,
      sortBy,
      sortDir,
    });

    if (res.meta) {
      addLog({
        method: res.meta.method,
        url: res.meta.url,
        status: res.status,
        elapsed: res.meta.elapsed,
      });
    }

    if (res.ok) {
      setTenants(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setTotalElements(res.data.totalElements || 0);
    } else {
      onTriggerToast('error', 'Query Failed', 'Failed to retrieve tenants registry.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, [status, page, sortBy, sortDir]);

  // Debounced search input handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(0); // Reset page on new search

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchTenants(val);
    }, 400);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setSortDir('DESC');
    }
    setPage(0);
  };

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortDir === 'ASC' ? <ChevronUp size={12} className="inline ml-1 text-cyber-rose" /> : <ChevronDown size={12} className="inline ml-1 text-cyber-rose" />;
  };

  return (
    <div className="admin-tenants-container">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Tenants Registry</h2>
        <p className="text-xs text-gray-500 font-mono">Manage registered organizations and configurations</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            className="admin-search-input"
            type="text"
            placeholder="Search by ID, name, owner, email…"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <select
          className="admin-filter-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="SUSPENDED">Suspended Only</option>
        </select>

        <button
          onClick={() => fetchTenants()}
          className="flex items-center justify-center p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white transition-all"
          title="Force refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table Panel */}
      <TiltCard3D glowColor="rgba(244, 63, 94, 0.05)" depth={2}>
        <div className="admin-tenants-panel">
          <div className="admin-tenants-table-wrapper">
            {loading && tenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <RefreshCw size={20} className="text-cyber-rose animate-spin" />
                <span className="text-xs font-mono text-gray-500">Querying registry…</span>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-20 text-xs font-mono text-gray-500">
                No tenants found matching criteria.
              </div>
            ) : (
              <table className="admin-tenants-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('id')}>
                      Tenant ID {renderSortIndicator('id')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      Company Name {renderSortIndicator('name')}
                    </th>
                    <th>Owner</th>
                    <th>Contact Email</th>
                    <th className="sortable" onClick={() => handleSort('createdAt')}>
                      Created Date {renderSortIndicator('createdAt')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('status')}>
                      Status {renderSortIndicator('status')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-xs text-cyber-cyan">{t.id}</td>
                      <td className="font-semibold text-white">{t.name}</td>
                      <td>{t.ownerName || '—'}</td>
                      <td>{t.contactEmail || '—'}</td>
                      <td className="font-mono text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`tenant-badge-status ${t.status.toLowerCase()}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleSort('id')} // Just placeholder click trigger, wait, no, trigger detail
                          className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 hover:text-white hover:border-cyber-rose/40 cursor-pointer"
                          onClickCapture={() => onSelectTenant(t.id)}
                        >
                          <span>Manage</span>
                          <ArrowRight size={12} className="text-cyber-rose" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="admin-pagination-bar">
              <div>
                Showing page {page + 1} of {totalPages} ({totalElements} total tenants)
              </div>
              <div className="admin-pagination-buttons">
                <button
                  className="admin-page-btn"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    className={`admin-page-btn ${page === idx ? 'active' : ''}`}
                    onClick={() => setPage(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className="admin-page-btn"
                  disabled={page === totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </TiltCard3D>
    </div>
  );
}
