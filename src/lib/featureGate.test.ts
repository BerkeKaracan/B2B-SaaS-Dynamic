import { describe, expect, it } from 'vitest';
import {
  AI_CANVAS_GENERATOR,
  COLLAB_CANVAS_SYNC,
  isFeatureEnabledLocal,
  normalizeTier,
  resolveFeatureEnabled,
} from './featureGate';

describe('featureGate', () => {
  it('normalizes free to basic', () => {
    expect(normalizeTier('free')).toBe('basic');
    expect(normalizeTier('PRO')).toBe('pro');
  });

  it('enables AI canvas generator for advanced and pro only (local)', () => {
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'basic')).toBe(false);
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'free')).toBe(false);
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'advanced')).toBe(true);
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'pro')).toBe(true);
  });

  it('keeps collab.canvas_sync off for all local tiers (kill-switch default)', () => {
    expect(isFeatureEnabledLocal(COLLAB_CANVAS_SYNC, 'pro')).toBe(false);
    expect(
      resolveFeatureEnabled(COLLAB_CANVAS_SYNC, 'pro', { status: 'unset' })
        .enabled
    ).toBe(false);
  });

  it('returns false for unknown keys locally', () => {
    expect(isFeatureEnabledLocal('unknown.flag', 'pro')).toBe(false);
  });

  it('uses Pulse SoT when remote ok (even if local would allow)', () => {
    const advancedOff = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'advanced', {
      status: 'ok',
      enabled: false,
    });
    expect(advancedOff.enabled).toBe(false);
    expect(advancedOff.source).toBe('remote');

    const basicOn = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'basic', {
      status: 'ok',
      enabled: true,
    });
    expect(basicOn.enabled).toBe(true);
    expect(basicOn.source).toBe('remote');
  });

  it('falls back to tier when Pulse is down', () => {
    const advanced = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'advanced', {
      status: 'error',
    });
    expect(advanced.enabled).toBe(true);
    expect(advanced.source).toBe('fallback');

    const basic = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'basic', {
      status: 'error',
    });
    expect(basic.enabled).toBe(false);
    expect(basic.source).toBe('fallback');
  });

  it('falls back to tier when Pulse is unset', () => {
    const pro = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'pro', {
      status: 'unset',
    });
    expect(pro.enabled).toBe(true);
    expect(pro.source).toBe('fallback');
  });
});
