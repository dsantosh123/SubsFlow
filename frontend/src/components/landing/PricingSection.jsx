import React, { useState } from 'react';
import { Check, Zap, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function PricingSection({ onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' | 'annual'

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal for early-stage SaaS projects and small teams.',
      priceMonthly: 29,
      priceAnnual: 23,
      badge: null,
      features: [
        'Up to 5 Team Members',
        '2 Isolated Workspaces',
        'Standard RBAC (Admin & Viewer)',
        '50,000 Usage Events / mo',
        'PostgreSQL RLS Database Security',
        'Standard REST API & Webhooks',
        'Email Support',
      ],
      ctaText: 'Start Starter Trial',
      popular: false,
    },
    {
      id: 'growth',
      name: 'Growth',
      description: 'For growing SaaS companies that need robust collaboration.',
      priceMonthly: 79,
      priceAnnual: 63,
      badge: 'MOST POPULAR',
      features: [
        'Up to 20 Team Members',
        'Unlimited Workspaces & Tenants',
        'Full Role Matrix (Admin, Editor, Viewer)',
        '1,000,000 Usage Events / mo',
        'Real-time Redis Metering & Rate Limiting',
        'SKIP LOCKED Outbox Event Relays',
        'Full Audit Trail & Team Logging',
        'Priority Slack & Email Support',
      ],
      ctaText: 'Start Growth Trial',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Dedicated infrastructure, custom security, and 24/7 support.',
      priceMonthly: 249,
      priceAnnual: 199,
      badge: 'ENTERPRISE',
      features: [
        'Unlimited Team Members & Seats',
        'Unlimited Workspaces & Clusters',
        'Custom SSO & SAML Authentication',
        '10M+ Usage Events with Kafka Streaming',
        'Dedicated Connection Pools',
        'Custom Dunning & Payment Gateways',
        '99.99% Uptime SLA Guarantee',
        '24/7 Dedicated Support Engineer',
      ],
      ctaText: 'Contact Enterprise',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="primary" size="md" className="mb-4">
            Simple, Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Scale your multi-tenant SaaS without unexpected costs
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Start with our 14-day full feature trial. No credit card required to get started.
          </p>

          {/* Billing Switcher Toggle */}
          <div className="mt-8 inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-extrabold">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 items-stretch">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                  plan.popular
                    ? 'bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 ring-4 ring-indigo-50'
                    : 'bg-white border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {!plan.popular && plan.badge && (
                      <Badge variant="purple" size="sm">
                        {plan.badge}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2 text-xs sm:text-sm text-slate-500 min-h-[38px]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                      ${price}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      / month
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block mt-1">
                    {billingCycle === 'annual' ? 'Billed annually ($' + price * 12 + '/yr)' : 'Billed monthly'}
                  </span>

                  {/* Divider */}
                  <div className="my-6 border-t border-slate-100" />

                  {/* Features List */}
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => onSelectPlan(plan.id)}
                    className="w-full justify-center"
                  >
                    {plan.ctaText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
