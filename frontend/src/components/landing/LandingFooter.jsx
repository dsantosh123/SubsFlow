import React from 'react';
import { Zap, Activity, Globe, Share2, MessageSquare } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/80 text-slate-600 text-xs py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo & Status Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-2xs">
                <Zap size={15} className="fill-white" />
              </div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                SubsFlow
              </span>
            </div>

            <p className="text-slate-500 max-w-sm leading-relaxed">
              Enterprise multi-tenant subscription infrastructure, database isolation, and team collaboration workspace for high-growth software teams.
            </p>

            {/* System Status Badge */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99% Uptime)</span>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li><a href="#collaboration" className="hover:text-indigo-600 transition-colors">Workspace Collaboration</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Multi-Tenant Engine</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Role Management (RBAC)</a></li>
              <li><a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing & Plans</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Architecture</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">PostgreSQL RLS</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Transactional Outbox</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Redis Rate Limiter</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Kafka Streaming</a></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Security & Legal</h4>
            <ul className="space-y-2">
              <li><a href="#privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              <li><a href="#security" className="hover:text-indigo-600 transition-colors">SOC2 Type II Compliance</a></li>
              <li><a href="#audit" className="hover:text-indigo-600 transition-colors">Audit Logs</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400">
            © {new Date().getFullYear()} SubsFlow Cloud Platform, Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors"><Globe size={16} /></a>
            <a href="#" className="hover:text-slate-600 transition-colors"><Share2 size={16} /></a>
            <a href="#" className="hover:text-slate-600 transition-colors"><MessageSquare size={16} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
