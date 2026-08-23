import React, { useState } from 'react';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { WebhookEndpointsView } from './WebhookEndpointsView';
import { UsageTrackingView } from './UsageTrackingView';
import { NotificationCenterView } from './NotificationCenterView';
import { Send, BarChart3, Bell, Zap } from 'lucide-react';

export function OperationsHubView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [activeTab, setActiveTab] = useState('webhooks'); // 'webhooks' | 'usage' | 'notifications'

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Operations, Webhooks & Automation Hub</h3>
            <Badge variant="primary" size="sm">PHASE 7</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time event streaming, feature telemetry usage tracking, signed outbound webhook notifications, and automated alerts for <strong>{product.name}</strong>.
          </p>
        </div>
      </div>

      {/* Subtabs */}
      <div className="border-b border-slate-200">
        <Tabs
          tabs={[
            { id: 'webhooks', label: 'Outbound Webhooks', icon: <Send size={14} /> },
            { id: 'usage', label: 'Feature Usage Tracking', icon: <BarChart3 size={14} /> },
            { id: 'notifications', label: 'Notifications & Automation', icon: <Bell size={14} /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Tab 1: Webhooks */}
      {activeTab === 'webhooks' && (
        <WebhookEndpointsView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab 2: Usage Tracking */}
      {activeTab === 'usage' && (
        <UsageTrackingView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <NotificationCenterView
          product={product}
          onTriggerToast={onTriggerToast}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
}
