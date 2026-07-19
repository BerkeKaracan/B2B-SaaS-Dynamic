export type PlanId = 'basic' | 'advanced' | 'pro';

export type PlanPricesUsd = {
  monthly: number;
  annual: number;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  pricesUsd: PlanPricesUsd;
  /** Max team seats; 999 = unlimited display */
  seatLimit: number;
  features: string[];
  popular?: boolean;
  marketingCta: string;
  marketingHref: string;
};

/** Plan prices quoted in USD (source of truth before FX conversion). */
export const PLAN_PRICES_USD: Record<PlanId, PlanPricesUsd> = {
  basic: { monthly: 0, annual: 0 },
  advanced: { monthly: 49, annual: 470 },
  pro: { monthly: 199, annual: 1900 },
};

export const PLANS: PlanDefinition[] = [
  {
    id: 'basic',
    name: 'Basic',
    description:
      'Ideal for individual creators building workflow infrastructures.',
    pricesUsd: PLAN_PRICES_USD.basic,
    seatLimit: 3,
    features: [
      'Up to 3 team members',
      'Up to 5 custom projects / canvases',
      'Infinite Node Canvas layout',
      'Real-time background Auto-Save',
      'Community support',
    ],
    marketingCta: 'Start Free',
    marketingHref: '/register',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description:
      'Perfect for growing teams requiring collaborative pipelines.',
    pricesUsd: PLAN_PRICES_USD.advanced,
    seatLimit: 50,
    features: [
      'Up to 50 team members',
      'Up to 100 custom projects / canvases',
      'AI canvas generator',
      'Advanced Team Collaboration',
      'Workspace RBAC & Roles management',
      'Priority email support',
      'Custom user roles',
    ],
    popular: true,
    marketingCta: 'Upgrade Engine',
    marketingHref: '/register',
  },
  {
    id: 'pro',
    name: 'Pro',
    description:
      'Built for enterprise scale with unlimited structural power.',
    pricesUsd: PLAN_PRICES_USD.pro,
    seatLimit: 999,
    features: [
      'Unlimited team members',
      'Unlimited custom projects / canvases',
      'AI canvas generator',
      'Row-Level Database Security (RLS)',
      'Dedicated account manager',
      '24/7 phone support',
      'Audit logs & compliance',
    ],
    marketingCta: 'Go Unlimited',
    marketingHref: '/register',
  },
];

export function getPlan(id: PlanId): PlanDefinition {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function getPlanPriceUsd(id: PlanId, annual: boolean): number {
  const prices = PLAN_PRICES_USD[id];
  return annual ? prices.annual : prices.monthly;
}

export function workspaceCtaLabel(
  planId: PlanId,
  currentTier: string | undefined
): string {
  if (currentTier === planId) return 'Current Plan';
  if (planId === 'basic') return 'Downgrade';
  if (planId === 'advanced') return 'Upgrade to Advanced';
  return 'Upgrade to Pro';
}
