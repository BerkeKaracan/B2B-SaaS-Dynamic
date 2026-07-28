import { describe, expect, it } from 'vitest';
import {
  COLLAB_CANVAS_SYNC,
  isFeatureEnabledLocal,
  resolveFeatureEnabled,
} from './featureGate';
import {
  MAX_Y_UPDATE_BYTES,
  decodeYUpdateFromBroadcast,
  encodeYUpdateForBroadcast,
  uint8ToBase64,
} from './canvasCollabCodec';

describe('collab.canvas_sync flag', () => {
  it('never enables via local tier fallback', () => {
    expect(isFeatureEnabledLocal(COLLAB_CANVAS_SYNC, 'basic')).toBe(false);
    expect(isFeatureEnabledLocal(COLLAB_CANVAS_SYNC, 'advanced')).toBe(false);
    expect(isFeatureEnabledLocal(COLLAB_CANVAS_SYNC, 'pro')).toBe(false);

    for (const tier of ['basic', 'advanced', 'pro'] as const) {
      const unset = resolveFeatureEnabled(COLLAB_CANVAS_SYNC, tier, {
        status: 'unset',
      });
      expect(unset.enabled).toBe(false);
      expect(unset.source).toBe('fallback');

      const err = resolveFeatureEnabled(COLLAB_CANVAS_SYNC, tier, {
        status: 'error',
      });
      expect(err.enabled).toBe(false);
    }
  });

  it('respects Pulse SoT when remote ok (kill-switch off/on)', () => {
    expect(
      resolveFeatureEnabled(COLLAB_CANVAS_SYNC, 'pro', {
        status: 'ok',
        enabled: true,
      }).enabled
    ).toBe(true);
    expect(
      resolveFeatureEnabled(COLLAB_CANVAS_SYNC, 'pro', {
        status: 'ok',
        enabled: false,
      }).enabled
    ).toBe(false);
  });
});

describe('canvasCollabCodec', () => {
  it('round-trips small updates', () => {
    const bytes = new Uint8Array([1, 2, 3, 250, 0]);
    const encoded = encodeYUpdateForBroadcast(bytes);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(encoded.byteLength).toBe(5);
    expect(decodeYUpdateFromBroadcast(encoded.base64)).toEqual(bytes);
  });

  it('drops oversized updates instead of broadcasting', () => {
    const huge = new Uint8Array(MAX_Y_UPDATE_BYTES + 1);
    huge.fill(7);
    const encoded = encodeYUpdateForBroadcast(huge);
    expect(encoded.ok).toBe(false);
    if (encoded.ok) return;
    expect(encoded.reason).toBe('too_large');
    expect(encoded.byteLength).toBe(MAX_Y_UPDATE_BYTES + 1);
  });

  it('rejects empty and oversize decode', () => {
    expect(decodeYUpdateFromBroadcast('')).toBeNull();
    expect(decodeYUpdateFromBroadcast(null)).toBeNull();
    const over = uint8ToBase64(new Uint8Array(MAX_Y_UPDATE_BYTES + 10));
    expect(decodeYUpdateFromBroadcast(over)).toBeNull();
  });
});
