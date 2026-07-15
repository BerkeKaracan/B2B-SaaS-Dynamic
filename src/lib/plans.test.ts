import { describe, expect, it } from 'vitest';
import {
  getPlan,
  getPlanPriceUsd,
  workspaceCtaLabel,
  PLAN_PRICES_USD,
} from '@/lib/plans';

describe('plans', () => {
  it('getPlan returns the matching plan definition', () => {
    const plan = getPlan('advanced');
    expect(plan.id).toBe('advanced');
    expect(plan.popular).toBe(true);
    expect(plan.pricesUsd).toEqual(PLAN_PRICES_USD.advanced);
  });

  it('getPlanPriceUsd returns monthly and annual prices', () => {
    expect(getPlanPriceUsd('pro', false)).toBe(199);
    expect(getPlanPriceUsd('pro', true)).toBe(1900);
    expect(getPlanPriceUsd('basic', false)).toBe(0);
  });

  it('workspaceCtaLabel reflects current tier', () => {
    expect(workspaceCtaLabel('advanced', 'advanced')).toBe('Current Plan');
    expect(workspaceCtaLabel('basic', 'pro')).toBe('Downgrade');
    expect(workspaceCtaLabel('advanced', 'basic')).toBe('Upgrade to Advanced');
    expect(workspaceCtaLabel('pro', 'basic')).toBe('Upgrade to Pro');
  });
});
