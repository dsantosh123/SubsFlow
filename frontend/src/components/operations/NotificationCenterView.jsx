import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { 
  listNotifications, 
  markNotificationRead, 
  getNotificationPreferences, 
  saveNotificationPreference 
} from '../../eventsApi';
import { 
  Bell, 
  Mail, 
  CheckCircle2, 
  Check, 
  Settings, 
  RotateCw, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

const STANDARD_EVENT_TYPES = [
  { id: 'PAYMENT_SUCCEEDED', label: 'Payment Succeeded', desc: 'Customer charged successfully for subscription' },
  { id: 'PAYMENT_FAILED', label: 'Payment Failed / Declined', desc: 'Card declined or payment provider rejection' },
  { id: 'PAYMENT_REFUNDED', label: 'Payment Refunded', desc: 'Full or partial refund issued' },
  { id: 'SUBSCRIPTION_CREATED', label: 'Subscription Created', desc: 'New customer subscription initiated' },
  { id: 'SUBSCRIPTION_CANCELLED', label: 'Subscription Cancelled', desc: 'Customer or admin cancelled subscription' },
  { id: 'SUBSCRIPTION_PAUSED', label: 'Subscription Paused', desc: 'Temporary billing hold applied' },
  { id: 'SUBSCRIPTION_RESUMED', label: 'Subscription Resumed', desc: 'Billing restored to active state' },
  { id: 'TRIAL_STARTED', label: 'Trial Period Started', desc: 'Free trial active for new subscription' },
];

export function NotificationCenterView({
  product,
  onTriggerToast,
  currentUserRole = 'OWNER',
}) {
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('stream'); // 'stream' | 'preferences'
  const [loading, setLoading] = useState(true);
  const [savingPref, setSavingPref] = useState(null);

  const isDeveloper = currentUserRole.toUpperCase() === 'DEVELOPER';

  const loadData = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    const [notifRes, prefRes] = await Promise.all([
      listNotifications(product.id),
      getNotificationPreferences(product.id),
    ]);

    if (notifRes.ok && Array.isArray(notifRes.data)) setNotifications(notifRes.data);
    else setNotifications([]);

    if (prefRes.ok && Array.isArray(prefRes.data)) setPreferences(prefRes.data);
    else setPreferences([]);

    setLoading(false);
  }, [product?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkRead = async (notificationId) => {
    const res = await markNotificationRead(product.id, notificationId);
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, status: 'READ' } : n))
      );
    }
  };

  const handleTogglePref = async (eventType, channel, currentValue) => {
    if (isDeveloper) return;
    setSavingPref(eventType);

    const existingPref = preferences.find((p) => p.eventType === eventType);
    const emailEnabled = channel === 'email' ? !currentValue : (existingPref ? existingPref.emailEnabled : true);
    const inAppEnabled = channel === 'inApp' ? !currentValue : (existingPref ? existingPref.inAppEnabled : true);

    try {
      const res = await saveNotificationPreference(product.id, {
        eventType,
        emailEnabled,
        inAppEnabled,
      });

      if (res.ok) {
        setPreferences((prev) => {
          const filtered = prev.filter((p) => p.eventType !== eventType);
          return [...filtered, res.data];
        });
        if (onTriggerToast) {
          onTriggerToast('info', 'Preference Saved', `Updated notification channel settings for ${eventType}.`);
        }
      }
    } finally {
      setSavingPref(null);
    }
  };

  const getPrefForEvent = (eventType) => {
    const p = preferences.find((x) => x.eventType === eventType);
    return {
      emailEnabled: p ? p.emailEnabled : true,
      inAppEnabled: p ? p.inAppEnabled : true,
    };
  };

  return (
    <div className="space-y-6">
      {/* Subtab Toggle */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeSubTab === 'stream' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubTab('stream')}
          >
            <Bell size={13} className="mr-1.5" />
            <span>Notification Stream ({notifications.length})</span>
          </Button>

          <Button
            variant={activeSubTab === 'preferences' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSubTab('preferences')}
          >
            <Settings size={13} className="mr-1.5" />
            <span>Event Preferences Matrix</span>
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={loadData}>
          <RotateCw size={13} className="mr-1.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* View 1: Notification Stream */}
      {activeSubTab === 'stream' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">In-App & Email Event Stream</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated event notifications triggered by lifecycle state changes and billing transactions.
              </p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
              No notifications dispatched yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => {
                const isRead = n.status === 'READ';
                return (
                  <div
                    key={n.id}
                    className={`py-3.5 px-3 rounded-xl flex items-start justify-between gap-4 transition-colors ${
                      isRead ? 'opacity-60 bg-transparent' : 'bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        {n.channel === 'EMAIL' ? <Mail size={15} /> : <Bell size={15} />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{n.title}</span>
                          <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                            {n.channel}
                          </Badge>
                          {!isRead && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-normal">{n.message}</p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkRead(n.id)}
                        className="h-7 text-xs text-slate-500 hover:text-indigo-600 shrink-0"
                      >
                        <Check size={12} className="mr-1" />
                        <span>Mark Read</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Preferences Matrix */}
      {activeSubTab === 'preferences' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h4 className="text-base font-bold text-slate-900">Automated Notification Channel Matrix</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure which subscription and billing events trigger in-app alerts and customer email notifications.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Event Trigger</th>
                  <th className="py-3 px-4 text-center">In-App Notification</th>
                  <th className="py-3 px-4 text-center">Email Notification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {STANDARD_EVENT_TYPES.map((ev) => {
                  const pref = getPrefForEvent(ev.id);
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{ev.label}</div>
                        <div className="text-[11px] text-slate-400">{ev.desc}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isDeveloper}
                          onClick={() => handleTogglePref(ev.id, 'inApp', pref.inAppEnabled)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            pref.inAppEnabled
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          } ${isDeveloper ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                          {pref.inAppEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isDeveloper}
                          onClick={() => handleTogglePref(ev.id, 'email', pref.emailEnabled)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            pref.emailEnabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          } ${isDeveloper ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                          {pref.emailEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
