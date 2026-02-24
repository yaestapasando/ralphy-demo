import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseBrowserInfo,
  isUnsupportedBrowser,
  inferConnectionType,
  getConnectionInfoWithFallback,
} from '../src/services/network-fallback.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockConnection(props = {}) {
  return {
    type: props.type ?? 'wifi',
    effectiveType: props.effectiveType ?? '4g',
    downlink: props.downlink ?? 10,
    rtt: props.rtt ?? 50,
    addEventListener() {},
    removeEventListener() {},
  };
}

// ---------------------------------------------------------------------------
// parseBrowserInfo
// ---------------------------------------------------------------------------

describe('parseBrowserInfo', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('detects Chrome on desktop', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('chrome');
    expect(info.mobile).toBe(false);
    expect(info.os).toBe('windows');
  });

  it('detects Chrome on Android', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('chrome');
    expect(info.mobile).toBe(true);
    expect(info.os).toBe('android');
  });

  it('detects Firefox on desktop', () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('firefox');
    expect(info.mobile).toBe(false);
    expect(info.os).toBe('linux');
  });

  it('detects Firefox on iOS (FxiOS)', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/121.0 Mobile/15E148 Safari/605.1.15';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('firefox');
    expect(info.mobile).toBe(true);
    expect(info.os).toBe('ios');
  });

  it('detects Safari on macOS', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('safari');
    expect(info.mobile).toBe(false);
    expect(info.os).toBe('macos');
  });

  it('detects Safari on iPhone', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('safari');
    expect(info.mobile).toBe(true);
    expect(info.os).toBe('ios');
  });

  it('detects Safari on iPad', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('safari');
    expect(info.mobile).toBe(true);
    expect(info.os).toBe('ios');
  });

  it('detects Edge', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('edge');
    expect(info.os).toBe('windows');
  });

  it('detects Opera', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('opera');
  });

  it('detects Chrome on iOS (CriOS)', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
    const info = parseBrowserInfo(ua);
    expect(info.browser).toBe('chrome');
    expect(info.mobile).toBe(true);
    expect(info.os).toBe('ios');
  });

  it('returns unknown for unrecognised UA', () => {
    const info = parseBrowserInfo('SomeWeirdBrowser/1.0');
    expect(info.browser).toBe('unknown');
    expect(info.os).toBe('unknown');
    expect(info.mobile).toBe(false);
  });

  it('handles empty string', () => {
    const info = parseBrowserInfo('');
    expect(info.browser).toBe('unknown');
    expect(info.os).toBe('unknown');
    expect(info.mobile).toBe(false);
  });

  it('reads navigator.userAgent when no argument is passed', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0' });
    const info = parseBrowserInfo();
    expect(info.browser).toBe('firefox');
    expect(info.os).toBe('linux');
  });

  it('handles missing navigator gracefully', () => {
    vi.stubGlobal('navigator', undefined);
    const info = parseBrowserInfo();
    expect(info.browser).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// isUnsupportedBrowser
// ---------------------------------------------------------------------------

describe('isUnsupportedBrowser', () => {
  it('returns true for Firefox', () => {
    expect(isUnsupportedBrowser({ browser: 'firefox', mobile: false, os: 'linux' })).toBe(true);
  });

  it('returns true for Safari', () => {
    expect(isUnsupportedBrowser({ browser: 'safari', mobile: false, os: 'macos' })).toBe(true);
  });

  it('returns false for Chrome', () => {
    expect(isUnsupportedBrowser({ browser: 'chrome', mobile: false, os: 'windows' })).toBe(false);
  });

  it('returns false for Edge', () => {
    expect(isUnsupportedBrowser({ browser: 'edge', mobile: false, os: 'windows' })).toBe(false);
  });

  it('returns false for unknown browsers', () => {
    expect(isUnsupportedBrowser({ browser: 'unknown', mobile: false, os: 'unknown' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// inferConnectionType
// ---------------------------------------------------------------------------

describe('inferConnectionType', () => {
  const desktop = { browser: 'firefox', mobile: false, os: 'linux' };
  const mobile = { browser: 'safari', mobile: true, os: 'ios' };

  describe('ethernet detection', () => {
    it('infers ethernet for very low latency and high speed on desktop', () => {
      const result = inferConnectionType({ rtt: 3, downlink: 80, jitter: 1 }, desktop);
      expect(result.type).toBe('ethernet');
      expect(result.effectiveType).toBe('4g');
    });

    it('infers wifi instead of ethernet on mobile', () => {
      const result = inferConnectionType({ rtt: 3, downlink: 80, jitter: 1 }, mobile);
      expect(result.type).toBe('wifi');
      expect(result.effectiveType).toBe('4g');
    });
  });

  describe('wifi detection', () => {
    it('infers wifi for low latency and good speed on desktop', () => {
      const result = inferConnectionType({ rtt: 25, downlink: 30, jitter: 5 }, desktop);
      expect(result.type).toBe('wifi');
      expect(result.effectiveType).toBe('4g');
    });

    it('infers cellular instead of wifi for moderate latency on mobile', () => {
      const result = inferConnectionType({ rtt: 25, downlink: 30, jitter: 5 }, mobile);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('4g');
    });

    it('keeps wifi on mobile when latency is very low', () => {
      const result = inferConnectionType({ rtt: 8, downlink: 30, jitter: 2 }, mobile);
      expect(result.type).toBe('wifi');
      expect(result.effectiveType).toBe('4g');
    });
  });

  describe('4G cellular detection', () => {
    it('infers 4G cellular for good speed with moderate latency', () => {
      const result = inferConnectionType({ rtt: 60, downlink: 15, jitter: 10 }, desktop);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('4g');
    });
  });

  describe('3G detection', () => {
    it('infers 3G for moderate speed with higher latency', () => {
      const result = inferConnectionType({ rtt: 150, downlink: 1.5, jitter: 20 }, desktop);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('3g');
    });
  });

  describe('2G detection', () => {
    it('infers 2G for very slow speed with high latency', () => {
      const result = inferConnectionType({ rtt: 400, downlink: 0.1, jitter: 50 }, desktop);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('2g');
    });
  });

  describe('slow-2g detection', () => {
    it('infers slow-2g for extremely high latency', () => {
      const result = inferConnectionType({ rtt: 800, downlink: null, jitter: null }, desktop);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('slow-2g');
    });
  });

  describe('partial metrics', () => {
    it('falls back to downlink-only classification for high speed', () => {
      const result = inferConnectionType({ rtt: null, downlink: 20, jitter: null }, desktop);
      expect(result.type).toBe('wifi');
      expect(result.effectiveType).toBe('4g');
    });

    it('falls back to downlink-only classification for high speed on mobile', () => {
      const result = inferConnectionType({ rtt: null, downlink: 20, jitter: null }, mobile);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('4g');
    });

    it('falls back to downlink-only classification for medium speed', () => {
      const result = inferConnectionType({ rtt: null, downlink: 1.0, jitter: null }, desktop);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('3g');
    });

    it('falls back to downlink-only classification for low speed', () => {
      const result = inferConnectionType({ rtt: null, downlink: 0.1, jitter: null }, desktop);
      expect(result.type).toBe('cellular');
      expect(result.effectiveType).toBe('2g');
    });

    it('returns null for no metrics at all', () => {
      const result = inferConnectionType({ rtt: null, downlink: null, jitter: null }, desktop);
      expect(result.type).toBeNull();
      expect(result.effectiveType).toBeNull();
    });

    it('handles undefined values same as null', () => {
      const result = inferConnectionType({ rtt: undefined, downlink: undefined, jitter: undefined }, desktop);
      expect(result.type).toBeNull();
      expect(result.effectiveType).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles zero rtt and zero downlink', () => {
      const result = inferConnectionType({ rtt: 0, downlink: 0, jitter: 0 }, desktop);
      // rtt=0, downlink=0 won't match any rule; falls to downlink-only which gives 2g
      expect(result).toBeDefined();
    });

    it('handles extremely high values', () => {
      const result = inferConnectionType({ rtt: 1, downlink: 10000, jitter: 0 }, desktop);
      expect(result.type).toBe('ethernet');
    });
  });
});

// ---------------------------------------------------------------------------
// getConnectionInfoWithFallback
// ---------------------------------------------------------------------------

describe('getConnectionInfoWithFallback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns native API data with source=api when supported', () => {
    const conn = createMockConnection({ type: 'wifi', effectiveType: '4g', downlink: 10, rtt: 50 });
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfoWithFallback();
    expect(info.supported).toBe(true);
    expect(info.source).toBe('api');
    expect(info.type).toBe('wifi');
    expect(info.effectiveType).toBe('4g');
    expect(info.downlink).toBe(10);
    expect(info.rtt).toBe(50);
  });

  it('returns source=none when API unavailable and no metrics', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Firefox/121.0' });

    const info = getConnectionInfoWithFallback();
    expect(info.supported).toBe(false);
    expect(info.source).toBe('none');
    expect(info.type).toBeNull();
    expect(info.effectiveType).toBeNull();
  });

  it('returns heuristic data when API unavailable and metrics provided', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Firefox/121.0' });

    const info = getConnectionInfoWithFallback({ rtt: 25, downlink: 30, jitter: 5 });
    expect(info.supported).toBe(false);
    expect(info.source).toBe('heuristic');
    expect(info.type).toBe('wifi');
    expect(info.effectiveType).toBe('4g');
    expect(info.downlink).toBe(30);
    expect(info.rtt).toBe(25);
  });

  it('infers cellular on mobile Safari with moderate latency', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    const info = getConnectionInfoWithFallback({ rtt: 60, downlink: 15, jitter: 10 });
    expect(info.source).toBe('heuristic');
    expect(info.type).toBe('cellular');
    expect(info.effectiveType).toBe('4g');
  });

  it('prefers native API even when metrics are provided', () => {
    const conn = createMockConnection({ type: 'cellular', effectiveType: '3g', downlink: 1.5, rtt: 200 });
    vi.stubGlobal('navigator', { connection: conn });

    const info = getConnectionInfoWithFallback({ rtt: 25, downlink: 50, jitter: 2 });
    expect(info.source).toBe('api');
    expect(info.type).toBe('cellular');
  });

  it('returns null values for downlink/rtt when metrics lack them', () => {
    vi.stubGlobal('navigator', { userAgent: 'Firefox/121.0' });

    const info = getConnectionInfoWithFallback({ rtt: null, downlink: null, jitter: null });
    expect(info.source).toBe('heuristic');
    expect(info.type).toBeNull();
    expect(info.downlink).toBeNull();
    expect(info.rtt).toBeNull();
  });

  it('passes through measured rtt and downlink in heuristic mode', () => {
    vi.stubGlobal('navigator', { userAgent: 'Firefox/121.0' });

    const info = getConnectionInfoWithFallback({ rtt: 150, downlink: 1.5, jitter: 20 });
    expect(info.rtt).toBe(150);
    expect(info.downlink).toBe(1.5);
    expect(info.type).toBe('cellular');
    expect(info.effectiveType).toBe('3g');
  });
});
