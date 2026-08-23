import React from 'react';
import { ArrowRight, Play, Star, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DashboardMockup } from './DashboardMockup';

export function HeroSection({ onGetStarted, onExploreDemo }) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Soft Ambient Light Gradient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] hero-glow-gradient pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Feature Pill */}
        <div 
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-800 shadow-2xs mb-6 hover:bg-indigo-100/70 transition-all cursor-pointer select-none"
          onClick={onExploreDemo}
        >
          <Sparkles size={13} className="text-indigo-600" />
          <span>SubsFlow 2.0 Engine</span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-600 font-bold flex items-center gap-0.5">
            Interactive Workspace Collaboration <ArrowRight size={12} />
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
          The multi-tenant platform for{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
            high-velocity SaaS teams
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Zero-overhead workspace isolation, instant multi-tenant switching, and granular role-based access control. Ship enterprise subscriptions without infrastructure headaches.
        </p>

        {/* CTA Button Group */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <Button
            size="lg"
            variant="default"
            onClick={onGetStarted}
            className="w-full sm:w-auto shadow-md shadow-indigo-600/20 font-bold"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight size={16} />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onExploreDemo}
            className="w-full sm:w-auto font-semibold"
          >
            <Play size={14} className="fill-slate-700 text-slate-700" />
            <span>Explore Dashboard</span>
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="fill-current" />
              ))}
            </div>
            <span className="font-bold text-slate-800 ml-1">4.9/5</span>
            <span className="text-slate-400">from 1,200+ engineering teams</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span className="font-medium">PostgreSQL RLS Protected</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Check size={14} className="text-indigo-600" />
            <span className="font-medium">No credit card required</span>
          </div>
        </div>

        {/* Interactive Dashboard Mockup Container */}
        <div className="mt-12 sm:mt-14 max-w-5xl mx-auto">
          <DashboardMockup onOpenApp={onExploreDemo} />
        </div>
      </div>
    </section>
  );
}
