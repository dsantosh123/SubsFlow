import React from 'react';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Activity, 
  Lock, 
  Layers, 
  KeyRound, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export function CollaborationFeatures({ onExploreDemo }) {
  const features = [
    {
      icon: Users,
      badge: 'Collaboration Core',
      badgeVariant: 'primary',
      title: 'Role-Based Workspace Access (RBAC)',
      description: 'Assign Admin, Editor, and Viewer permissions with granular boundaries. Control team invites, plan changes, and financial data visibility seamlessly.',
      accent: 'border-indigo-200 bg-indigo-50/20',
    },
    {
      icon: Building2,
      badge: 'Multi-Tenant',
      badgeVariant: 'purple',
      title: 'Instant Multi-Tenant Switching',
      description: 'Switch between production, staging, and client sub-workspaces in one click with zero context contamination or session leaks.',
      accent: 'border-purple-200 bg-purple-50/20',
    },
    {
      icon: ShieldCheck,
      badge: 'Security',
      badgeVariant: 'success',
      title: 'PostgreSQL Row-Level Security',
      description: 'Hardware-grade database isolation. Queries automatically bind to app.current_tenant_id at the connection level so no tenant ever sees another’s data.',
      accent: 'border-emerald-200 bg-emerald-50/20',
    },
    {
      icon: UserCheck,
      badge: 'Team Onboarding',
      badgeVariant: 'blue',
      title: 'Automated Team Invitations',
      description: 'Invite team members via email with role pre-assignments. Enforce seat quota limits and revoke access with instant global propagation.',
      accent: 'border-blue-200 bg-blue-50/20',
    },
    {
      icon: Activity,
      badge: 'Telemetry',
      badgeVariant: 'warning',
      title: 'Real-Time Usage Metering',
      description: 'Ingest millions of API and subscription usage events per second. Distributed Redis rate limiting protects backend endpoints during spikes.',
      accent: 'border-amber-200 bg-amber-50/20',
    },
    {
      icon: Lock,
      badge: 'Reliability',
      badgeVariant: 'default',
      title: 'Transactional Outbox & Dunning',
      description: 'SKIP LOCKED outbox relays guarantee zero lost payment webhook events with automated smart retry schedules and circuit breaker resilience.',
      accent: 'border-slate-200 bg-slate-50/50',
    },
  ];

  return (
    <section id="collaboration" className="py-20 md:py-28 bg-slate-50/60 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" size="md" className="mb-4">
            Workspace Collaboration & Governance
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Built for seamless teamwork and strict multi-tenant isolation
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Empower your team with self-service workspace controls, role hierarchies, and rock-solid architectural boundaries.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="ui-card ui-card-hover p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-indigo-600">
                      <Icon size={20} />
                    </div>
                    <Badge variant={item.badgeVariant} size="sm">
                      {item.badge}
                    </Badge>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group cursor-pointer" onClick={onExploreDemo}>
                  <span>Explore in live workspace</span>
                  <ArrowRight size={12} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
