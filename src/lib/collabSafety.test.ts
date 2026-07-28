import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import {
  MAX_Y_UPDATE_BYTES,
  encodeYUpdateForBroadcast,
} from './canvasCollabCodec';

/**
 * Phase-3 style safety checks (automated stand-in for 2-client rate review).
 * Before enabling collab.canvas_sync in Pulse for any tenant:
 * - Confirm these pass in CI
 * - Manually verify 2 browsers on a small canvas
 * - Keep Pulse flag off as kill-switch
 */
describe('collab safety guards', () => {
  it('incremental map update stays far under Realtime soft cap', () => {
    const doc = new Y.Doc();
    const pages = doc.getMap<{ id: string; title: string }>('canvas-pages');
    let lastUpdate = new Uint8Array();
    doc.on('update', (u: Uint8Array) => {
      lastUpdate = u;
    });

    doc.transact(() => {
      pages.set('p1', { id: 'p1', title: 'A' });
    });
    const first = encodeYUpdateForBroadcast(lastUpdate);
    expect(first.ok).toBe(true);

    doc.transact(() => {
      pages.set('p1', { id: 'p1', title: 'B' });
    });
    const second = encodeYUpdateForBroadcast(lastUpdate);
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.byteLength).toBeLessThan(2_000);
      expect(second.byteLength).toBeLessThan(MAX_Y_UPDATE_BYTES);
    }
  });

  it('full-document wipe pattern is rejected when oversized', () => {
    const doc = new Y.Doc();
    const pages = doc.getArray('canvas-pages');
    let lastUpdate = new Uint8Array();
    doc.on('update', (u: Uint8Array) => {
      lastUpdate = u;
    });

    const fat = Array.from({ length: 200 }, (_, i) => ({
      id: `page-${i}`,
      title: 'x'.repeat(400),
      blocks: [{ id: `b-${i}`, value: 'y'.repeat(200) }],
    }));

    doc.transact(() => {
      pages.delete(0, pages.length);
      pages.insert(0, fat);
    });

    // May or may not exceed soft cap depending on encoding — assert guard works either way
    const encoded = encodeYUpdateForBroadcast(lastUpdate);
    if (!encoded.ok) {
      expect(encoded.reason).toBe('too_large');
      expect(encoded.byteLength).toBeGreaterThan(MAX_Y_UPDATE_BYTES);
    } else {
      expect(encoded.byteLength).toBeLessThanOrEqual(MAX_Y_UPDATE_BYTES);
    }
  });
});
