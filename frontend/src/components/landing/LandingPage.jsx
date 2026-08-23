import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { LogoRibbon } from './LogoRibbon';
import { CollaborationFeatures } from './CollaborationFeatures';
import { PricingSection } from './PricingSection';
import { LandingFooter } from './LandingFooter';
import { Button } from '../ui/Button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingPage({ onNavigateToApp, onNavigateToAuth, onNavigateToAdmin }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Sticky Navigation Bar */}
      <LandingNavbar
        onGetStarted={() => onNavigateToAuth('register')}
        onSignIn={() => onNavigateToAuth('login')}
        onExploreDemo={() => onNavigateToApp()}
        onNavigateToAdmin={onNavigateToAdmin}
      />

      <main>
        {/* Hero Section with Dashboard Mockup */}
        <HeroSection
          onGetStarted={() => onNavigateToAuth('register')}
          onExploreDemo={() => onNavigateToApp()}
        />

        {/* Trusted By Logo Ribbon */}
        <LogoRibbon />

        {/* Workspace Collaboration & Multi-Tenant Features Grid */}
        <CollaborationFeatures
          onExploreDemo={() => onNavigateToApp()}
        />

        {/* Pricing Tiers Table */}
        <PricingSection
          onSelectPlan={(planId) => onNavigateToAuth('register')}
        />

        {/* Bottom CTA Banner */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Instant Setup in under 2 minutes</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to power your SaaS with multi-tenant workspaces?
            </h2>

            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Join thousands of engineering teams building enterprise-ready subscriptions on SubsFlow.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                variant="default"
                onClick={() => onNavigateToAuth('register')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold w-full sm:w-auto"
              >
                <span>Create Your Workspace Now</span>
                <ArrowRight size={16} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigateToApp()}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
              >
                <span>Launch Interactive Demo</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
