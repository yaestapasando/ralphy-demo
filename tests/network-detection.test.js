import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getConnectionAPI,
  getConnectionInfo,
  onConnectionChange,
} from '../src/services/network-detection.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal mock of NetworkInformation with addEventListener/
 * removeEventListener and configurable properties.
 */
function createMockConnection(props = {}) {
  const listeners = {};
  return {
    type: props.type ?? 'wifi',
    effectiveType: props.effectiveType ?? '4g',
    downlink: props.downlink ?? 10,
    rtt: props.rtt ?? 50,
    addEventListener(event, fn) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },
    removeEventListener(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((h) => h !== fn);
    },
    /** Helper to fire a 'change' event from tests. */
    _fire(event) {
      (listeners[event] || []).forEach((fn) => fn());
    },
    _listeners: listeners,
  };
}

// ---------------------------------------------------------------------------
// getConnectionAPI
// ---------------------------------------------------------------------------

describe('getConnectionAPI', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns navigator.connection when available', () => {
    const conn = createMockConnection();
    vi.stubGlobal('navigator', { connection: conn });
    expect(getConnectionAPI()).toBe(conn);
  });

  it('returns navigator.mozConnection as fallback', () => {
    const conn = createMockConnection();
    vi.stubGlobal('navigator', { mozConnection: conn });
    expect(getConnectionAPI()).toBe(conn);
  });

  it('returns navigator.webkitConnection as fallback', () => {
    const conn = createMockConnection();
    vi.stubGlobal('navigator', { webkitConnection: conn });
    expect(getConnectionAPI()).toBe(conn);
  });

  it('returns null when no connection API exists', () => {
    vi.stubGlobal('navigator', {});
    expect(getConnectionAPI()).toBeNull();
  });

  it('returns null when navigator is undefined', () => {
    vi.stubGlobal('navigator', undefined);
    // navigator is undefined — getConnectionAPI checks typeof
    expect(getConnectionAPI()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getConnectionInfo
// ---------------------------------------------------------------------------

describe('getConnectionInfo', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns full info when API is available', () => {
    const conn = createMockConnection({
      type: 'cellular',
      effectiveType: '3g',
      downlink: 1.5,
      rtt: 300,
    });
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info).toEqual({
      supported: true,
      type: 'cellular',
      effectiveType: '3g',
      downlink: 1.5,
      rtt: 300,
    });
  });

  it('returns wifi connection info', () => {
    const conn = createMockConnection({
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    });
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info.supported).toBe(true);
    expect(info.type).toBe('wifi');
    expect(info.effectiveType).toBe('4g');
    expect(info.downlink).toBe(10);
    expect(info.rtt).toBe(50);
  });

  it('returns ethernet connection info', () => {
    const conn = createMockConnection({
      type: 'ethernet',
      effectiveType: '4g',
      downlink: 100,
      rtt: 5,
    });
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info.type).toBe('ethernet');
    expect(info.downlink).toBe(100);
  });

  it('returns unsupported info when API is missing', () => {
    vi.stubGlobal('navigator', {});

    const info = getConnectionInfo();
    expect(info).toEqual({
      supported: false,
      type: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
    });
  });

  it('handles missing optional properties with null', () => {
    const conn = createMockConnection();
    // Simulate a browser where type is not implemented
    delete conn.type;
    delete conn.downlink;
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info.supported).toBe(true);
    expect(info.type).toBeNull();
    expect(info.downlink).toBeNull();
    // effectiveType and rtt still present
    expect(info.effectiveType).toBe('4g');
    expect(info.rtt).toBe(50);
  });

  it('handles downlink being non-numeric', () => {
    const conn = createMockConnection();
    conn.downlink = undefined;
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info.downlink).toBeNull();
  });

  it('handles rtt being non-numeric', () => {
    const conn = createMockConnection();
    conn.rtt = undefined;
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info.rtt).toBeNull();
  });

  it('returns a new object each time (no shared reference)', () => {
    vi.stubGlobal('navigator', {});
    const a = getConnectionInfo();
    const b = getConnectionInfo();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('handles downlink of 0 as a valid number', () => {
    const conn = createMockConnection({ downlink: 0 });
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info.downlink).toBe(0);
  });

  it('handles rtt of 0 as a valid number', () => {
    const conn = createMockConnection({ rtt: 0 });
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfo();
    expect(info.rtt).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// onConnectionChange
// ---------------------------------------------------------------------------

describe('onConnectionChange', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('calls callback immediately with current state', () => {
    const conn = createMockConnection({ type: 'wifi', effectiveType: '4g' });
    vi.stubGlobal('navigator', { connection: conn });

    const cb = vi.fn();
    onConnectionChange(cb);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ supported: true, type: 'wifi' }),
    );
  });

  it('calls callback when connection changes', () => {
    const conn = createMockConnection({ type: 'wifi', effectiveType: '4g' });
    vi.stubGlobal('navigator', { connection: conn });

    const cb = vi.fn();
    onConnectionChange(cb);

    // Simulate a network change
    conn.type = 'cellular';
    conn.effectiveType = '3g';
    conn._fire('change');

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'cellular', effectiveType: '3g' }),
    );
  });

  it('stops receiving events after unsubscribe', () => {
    const conn = createMockConnection();
    vi.stubGlobal('navigator', { connection: conn });

    const cb = vi.fn();
    const unsubscribe = onConnectionChange(cb);
    expect(cb).toHaveBeenCalledTimes(1);

    unsubscribe();

    conn._fire('change');
    // Should NOT have been called again
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('returns no-op unsubscribe when API is missing', () => {
    vi.stubGlobal('navigator', {});

    const cb = vi.fn();
    const unsubscribe = onConnectionChange(cb);

    // Still called once with unsupported info
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ supported: false }),
    );

    // Unsubscribe should not throw
    expect(() => unsubscribe()).not.toThrow();
  });

  it('handles multiple subscribers independently', () => {
    const conn = createMockConnection({ type: 'wifi' });
    vi.stubGlobal('navigator', { connection: conn });

    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const unsub1 = onConnectionChange(cb1);
    onConnectionChange(cb2);

    // Both called once on subscribe
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);

    // Fire change
    conn._fire('change');
    expect(cb1).toHaveBeenCalledTimes(2);
    expect(cb2).toHaveBeenCalledTimes(2);

    // Unsubscribe first
    unsub1();
    conn._fire('change');
    expect(cb1).toHaveBeenCalledTimes(2); // no more calls
    expect(cb2).toHaveBeenCalledTimes(3); // still receiving
  });

  it('delivers updated values on change events', () => {
    const conn = createMockConnection({
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    });
    vi.stubGlobal('navigator', { connection: conn });

    const results = [];
    onConnectionChange((info) => results.push(info));

    // Initial
    expect(results).toHaveLength(1);
    expect(results[0].downlink).toBe(10);

    // Change to slower connection
    conn.type = 'cellular';
    conn.effectiveType = '2g';
    conn.downlink = 0.3;
    conn.rtt = 800;
    conn._fire('change');

    expect(results).toHaveLength(2);
    expect(results[1]).toEqual({
      supported: true,
      type: 'cellular',
      effectiveType: '2g',
      downlink: 0.3,
      rtt: 800,
    });
  });
});
