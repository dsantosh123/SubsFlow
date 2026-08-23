import React from 'react';
import { Zap, ArrowRight, ShieldCheck, Sparkles, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function LandingNavbar({ onGetStarted, onSignIn, onExploreDemo, onNavigateToAdmin }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20">
            <Zap size={18} className="fill-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              SubsFlow
            </span>
            <Badge variant="primary" size="sm">
              v2.0
            </Badge>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#collaboration" className="hover:text-indigo-600 transition-colors">Collaboration</a>
          <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <button
            onClick={onNavigateToAdmin}
            className="hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0 text-sm font-medium text-slate-600"
          >
            <Shield size={13} className="text-rose-500" />
            <span>Admin Ops</span>
          </button>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="text-slate-700 hover:text-slate-900"
          >
            Sign In
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onGetStarted}
            className="hidden sm:inline-flex shadow-xs"
          >
            <span>Get Started Free</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </header>
  );
}
