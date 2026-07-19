import { describe, expect, it } from 'vitest';
import {
  AI_CANVAS_GENERATOR,
  isFeatureEnabledLocal,
  normalizeTier,
} from '@/lib/featureGate';

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
});
