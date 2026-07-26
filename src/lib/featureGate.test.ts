import { describe, expect, it } from 'vitest';
import {
  AI_CANVAS_GENERATOR,
  isFeatureEnabledLocal,
  normalizeTier,
  resolveFeatureEnabled,
} from './featureGate';

describe('featureGate', () => {
  it('normalizes free to basic', () => {
    expect(normalizeTier('free')).toBe('basic');
    expect(normalizeTier('PRO')).toBe('pro');
  });

  it('enables AI canvas generator for advanced and pro only', () => {
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'basic')).toBe(false);
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'free')).toBe(false);
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'advanced')).toBe(true);
    expect(isFeatureEnabledLocal(AI_CANVAS_GENERATOR, 'pro')).toBe(true);
  });

  it('returns false for unknown keys', () => {
    expect(isFeatureEnabledLocal('unknown.flag', 'pro')).toBe(false);
  });

  it('keeps advanced/pro on even when Pulse returns false', () => {
    const advanced = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'advanced', {
      status: 'ok',
      enabled: false,
    });
    expect(advanced.enabled).toBe(true);
    expect(advanced.source).toBe('tier');

    const pro = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'pro', {
      status: 'ok',
      enabled: false,
    });
    expect(pro.enabled).toBe(true);
    expect(pro.source).toBe('tier');
  });

  it('lets Pulse grant basic trials', () => {
    const granted = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'basic', {
      status: 'ok',
      enabled: true,
    });
    expect(granted.enabled).toBe(true);
    expect(granted.source).toBe('remote');

    const denied = resolveFeatureEnabled(AI_CANVAS_GENERATOR, 'basic', {
      status: 'ok',
      enabled: false,
    });
    expect(denied.enabled).toBe(false);
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
  });
});
