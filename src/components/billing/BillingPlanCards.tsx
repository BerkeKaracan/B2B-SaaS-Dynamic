'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building,
  CheckCircle2,
  Shield,
  Zap,
} from 'lucide-react';
import {
  PLANS,
  getPlanPriceUsd,
  workspaceCtaLabel,
  type PlanId,
} from '@/lib/plans';

const PLAN_ICONS: Record<PlanId, React.ReactNode> = {
  basic: <Zap className="w-5 h-5 text-zinc-700" />,
  advanced: <Building className="w-5 h-5 text-indigo-600" />,
  pro: <Shield className="w-5 h-5 text-white" />,
};

const PLAN_ICON_WRAP: Record<PlanId, string> = {
  basic: 'bg-zinc-100',
  advanced: 'bg-indigo-50',
  pro: 'bg-zinc-900',
};

const CHECK_COLOR: Record<PlanId, string> = {
  basic: 'text-emerald-500',
  advanced: 'text-indigo-500',
  pro: 'text-zinc-900',
};

export type BillingPlanCardsProps = {
  mode: 'marketing' | 'workspace';
  /** Format a USD amount for display (FX-aware in workspace). */
  formatPrice: (amountUsd: number) => string;
  currentTier?: string;
  onSelectPlan?: (planId: PlanId) => void;
  isUpdating?: boolean;
  /** When true, non-current plan CTAs are disabled (no self-service upgrades). */
  upgradesDisabled?: boolean;
  upgradesDisabledReason?: string;
  /** When true, CTAs send an upgrade request to the platform admin instead of switching. */
  requestMode?: boolean;
  /** Controlled annual toggle; if omitted, component manages its own state. */
  isAnnual?: boolean;
  onAnnualChange?: (annual: boolean) => void;
};

export default function BillingPlanCards({
  mode,
  formatPrice,
  currentTier,
  onSelectPlan,
  isUpdating = false,
  upgradesDisabled = false,
  upgradesDisabledReason,
  requestMode = false,
  isAnnual: controlledAnnual,
  onAnnualChange,
}: BillingPlanCardsProps) {
  const [internalAnnual, setInternalAnnual] = useState(false);
  const isAnnual = controlledAnnual ?? internalAnnual;

  const setAnnual = (value: boolean) => {
    onAnnualChange?.(value);
    if (controlledAnnual === undefined) setInternalAnnual(value);
  };

  return (
    <div>
      {mode === 'workspace' && (upgradesDisabled || requestMode) && upgradesDisabledReason && (
        <p className="mb-6 text-center text-sm font-medium text-zinc-500">
          {upgradesDisabledReason}
        </p>
      )}
      <div className="flex justify-center mb-8">
        <div className="bg-zinc-100 p-1 rounded-xl flex items-center shadow-inner">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              !isAnnual
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              isAnnual
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Annually{' '}
            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
          mode === 'marketing' ? 'items-start gap-8' : 'mb-12'
        }`}
      >
        {PLANS.map((plan) => {
          const isCurrent = mode === 'workspace' && currentTier === plan.id;
          const price = formatPrice(getPlanPriceUsd(plan.id, isAnnual));
          const ringClass = isCurrent
            ? plan.id === 'advanced'
              ? 'border-indigo-600 ring-1 ring-indigo-600'
              : 'border-zinc-900 ring-1 ring-zinc-900'
            : plan.popular && mode === 'marketing'
              ? 'border-zinc-950 ring-2 ring-zinc-950/10 md:-translate-y-4 shadow-xl'
              : 'border-zinc-200/80 hover:border-zinc-300';

          return (
            <div
              key={plan.id}
              className={`relative bg-white border rounded-2xl shadow-sm p-8 transition-all flex flex-col ${ringClass} ${
                mode === 'marketing' ? 'rounded-[2rem] justify-between' : ''
              }`}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${PLAN_ICON_WRAP[plan.id]}`}>
                    {PLAN_ICONS[plan.id]}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
                </div>

                {mode === 'marketing' && (
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-6">
                    {plan.description}
                  </p>
                )}

                <div className="mb-6 flex items-end gap-1">
                  <span className="text-4xl font-black text-zinc-900 tracking-tight">
                    {price}
                  </span>
                  <span className="text-sm font-medium text-zinc-500 mb-1">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-zinc-600 font-medium"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${CHECK_COLOR[plan.id]}`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {mode === 'marketing' ? (
                <Link
                  href={plan.marketingHref}
                  className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all ${
                    plan.popular
                      ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                      : 'bg-zinc-50 text-zinc-900 border border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {plan.marketingCta}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isCurrent || isUpdating || upgradesDisabled}
                  onClick={() => onSelectPlan?.(plan.id)}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'bg-white border border-zinc-200 text-zinc-900'
                      : plan.id === 'advanced'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                        : plan.id === 'pro'
                          ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md hover:shadow-lg'
                          : 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {upgradesDisabled && !isCurrent
                    ? 'Contact administrator'
                    : requestMode && !isCurrent
                      ? `Request ${plan.name}`
                      : workspaceCtaLabel(plan.id, currentTier)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
