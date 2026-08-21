import { createContext, useContext, useReducer, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────
   Portal Types
   ───────────────────────────────────────────────────────── */
export const PORTALS = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    label: 'Super-Admin',
    path: '/admin',
    icon: '🛡️',
    color: '#f43f5e',
    description: 'Global Operations & Tenant Management Console',
  },
  MERCHANT: {
    id: 'MERCHANT',
    label: 'Merchant',
    path: '/workspace',
    icon: '🏢',
    color: '#6366f1',
    description: 'Subscription & Billing Workspace',
  },
  CUSTOMER: {
    id: 'CUSTOMER',
    label: 'Customer',
    path: '/portal',
    icon: '👤',
    color: '#06b6d4',
    description: 'Self-Service Subscription Portal',
  },
};

/* ─────────────────────────────────────────────────────────
   State Shape & Reducer
   ───────────────────────────────────────────────────────── */
const initialState = {
  activePortal: PORTALS.MERCHANT.id,
  tenantSession: null, // { tenantId, name, apiKey, token }
  apiLatency: null,    // last measured latency in ms
};

function portalReducer(state, action) {
  switch (action.type) {
    case 'SWITCH_PORTAL':
      return { ...state, activePortal: action.payload };
    case 'SET_TENANT_SESSION':
      return { ...state, tenantSession: action.payload };
    case 'CLEAR_SESSION':
      return { ...state, tenantSession: null, apiLatency: null };
    case 'UPDATE_LATENCY':
      return { ...state, apiLatency: action.payload };
    default:
      return state;
  }
}

/* ─────────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────────── */
const PortalContext = createContext(null);

export function PortalProvider({ children }) {
  const [state, dispatch] = useReducer(portalReducer, initialState);

  const switchPortal = useCallback((portalId) => {
    if (PORTALS[portalId]) {
      dispatch({ type: 'SWITCH_PORTAL', payload: portalId });
    }
  }, []);

  const setTenantSession = useCallback((session) => {
    dispatch({ type: 'SET_TENANT_SESSION', payload: session });
  }, []);

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  const updateLatency = useCallback((ms) => {
    dispatch({ type: 'UPDATE_LATENCY', payload: ms });
  }, []);

  const value = {
    ...state,
    portal: PORTALS[state.activePortal],
    portals: PORTALS,
    switchPortal,
    setTenantSession,
    clearSession,
    updateLatency,
  };

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}

export default PortalContext;
