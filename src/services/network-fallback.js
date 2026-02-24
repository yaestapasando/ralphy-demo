/**
 * Fallback network detection for browsers without Network Information API
 * (Firefox, Safari, etc.).
 *
 * Uses User Agent parsing to detect the browser/platform and speed-based
 * heuristics (latency, download speed, jitter) to infer the connection type.
 */

import { getConnectionAPI, getConnectionInfo } from './network-detection.js';

// ---------------------------------------------------------------------------
// User Agent detection
// ---------------------------------------------------------------------------

/**
 * @typedef {object} BrowserInfo
 * @property {string} browser  - 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown'
 * @property {boolean} mobile  - Whether the device appears to be mobile.
 * @property {string} os       - 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown'
 */

/**
 * Parses the User Agent string to extract browser, OS, and mobile status.
 *
 * @param {string} [ua] - User agent string. Defaults to `navigator.userAgent`.
 * @returns {BrowserInfo}
 */
export function parseBrowserInfo(ua) {
  if (ua === undefined) {
    ua = typeof navigator !== 'undefined' ? navigator.userAgent ?? '' : '';
  }

  const lower = ua.toLowerCase();

  const mobile = /mobi|android|iphone|ipad|ipod/.test(lower);

  let os = 'unknown';
  if (/android/.test(lower)) os = 'android';
  else if (/iphone|ipad|ipod/.test(lower)) os = 'ios';
  else if (/windows/.test(lower)) os = 'windows';
  else if (/mac os|macintosh/.test(lower)) os = 'macos';
  else if (/linux/.test(lower)) os = 'linux';

  // Order matters: Edge includes "Edg/", FxiOS includes "Safari"
  let browser = 'unknown';
  if (/edg\//.test(lower)) browser = 'edge';
  else if (/opr\/|opera/.test(lower)) browser = 'opera';
  else if (/firefox|fxios/.test(lower)) browser = 'firefox';
  else if (/chrome|crios/.test(lower)) browser = 'chrome';
  else if (/safari/.test(lower)) browser = 'safari';

  return { browser, mobile, os };
}

/**
 * Returns true when the current browser is known to NOT support the
 * Network Information API.
 *
 * @param {BrowserInfo} [info] - Pre-parsed browser info (computed if omitted).
 * @returns {boolean}
 */
export function isUnsupportedBrowser(info) {
  if (!info) info = parseBrowserInfo();
  return info.browser === 'firefox' || info.browser === 'safari';
}

// ---------------------------------------------------------------------------
// Speed heuristics
// ---------------------------------------------------------------------------

/**
 * @typedef {object} SpeedMetrics
 * @property {number|null} rtt       - Round-trip time in ms (from ping).
 * @property {number|null} downlink  - Download speed in Mbps.
 * @property {number|null} jitter    - Jitter in ms (std deviation of pings).
 */

/**
 * Thresholds for each connection category.
 * Based on typical measured characteristics for each network type.
 *
 * Evaluation order: ethernet → wifi → 4g → 3g → 2g → slow-2g
 */
const HEURISTIC_RULES = [
  {
    type: 'ethernet',
    effectiveType: '4g',
    match: (m) => m.rtt !== null && m.rtt < 10
      && m.downlink !== null && m.downlink >= 50
      && m.jitter !== null && m.jitter < 3,
  },
  {
    type: 'wifi',
    effectiveType: '4g',
    match: (m) => m.rtt !== null && m.rtt < 50
      && m.downlink !== null && m.downlink >= 5,
  },
  {
    type: 'cellular',
    effectiveType: '4g',
    match: (m) => m.downlink !== null && m.downlink >= 5
      && m.rtt !== null && m.rtt >= 20,
  },
  {
    type: 'cellular',
    effectiveType: '3g',
    match: (m) => m.downlink !== null && m.downlink >= 0.5
      && m.rtt !== null && m.rtt >= 50,
  },
  {
    type: 'cellular',
    effectiveType: '2g',
    match: (m) => m.downlink !== null && m.downlink >= 0.05
      && m.rtt !== null && m.rtt >= 200,
  },
  {
    type: 'cellular',
    effectiveType: 'slow-2g',
    match: (m) => m.rtt !== null && m.rtt >= 500,
  },
];

/**
 * Infers connection type and quality from measured speed metrics.
 *
 * @param {SpeedMetrics} metrics
 * @param {BrowserInfo} [browserInfo] - Pre-parsed browser info.
 * @returns {{ type: string|null, effectiveType: string|null }}
 */
export function inferConnectionType(metrics, browserInfo) {
  if (!browserInfo) browserInfo = parseBrowserInfo();

  // If we have no metrics at all, we can't infer anything
  if (
    (metrics.rtt === null || metrics.rtt === undefined)
    && (metrics.downlink === null || metrics.downlink === undefined)
  ) {
    return { type: null, effectiveType: null };
  }

  // Normalize: treat undefined as null
  const m = {
    rtt: metrics.rtt ?? null,
    downlink: metrics.downlink ?? null,
    jitter: metrics.jitter ?? null,
  };

  // Mobile devices are more likely cellular
  const isMobile = browserInfo.mobile;

  for (const rule of HEURISTIC_RULES) {
    if (rule.match(m)) {
      // On mobile, promote wifi guesses to cellular unless latency is very low
      if (isMobile && rule.type === 'wifi' && m.rtt !== null && m.rtt >= 20) {
        return { type: 'cellular', effectiveType: rule.effectiveType };
      }
      // On mobile, ethernet is unlikely — treat as wifi
      if (isMobile && rule.type === 'ethernet') {
        return { type: 'wifi', effectiveType: rule.effectiveType };
      }
      return { type: rule.type, effectiveType: rule.effectiveType };
    }
  }

  // Fallback: use whatever partial data we have
  if (m.downlink !== null) {
    if (m.downlink >= 5) return { type: isMobile ? 'cellular' : 'wifi', effectiveType: '4g' };
    if (m.downlink >= 0.5) return { type: 'cellular', effectiveType: '3g' };
    return { type: 'cellular', effectiveType: '2g' };
  }

  return { type: null, effectiveType: null };
}

// ---------------------------------------------------------------------------
// Unified API
// ---------------------------------------------------------------------------

/**
 * Returns connection info, using the native API when available or falling
 * back to heuristics when it's not.
 *
 * When using the fallback, `supported` is `false` and a `source` field is
 * added set to `'heuristic'` so callers know the values are estimated.
 *
 * @param {SpeedMetrics} [metrics] - Measured speed data for heuristic inference.
 * @returns {import('./network-detection.js').ConnectionInfo & { source?: string }}
 */
export function getConnectionInfoWithFallback(metrics) {
  const api = getConnectionAPI();

  if (api) {
    return { ...getConnectionInfo(), source: 'api' };
  }

  // No native API — use heuristics if metrics are provided
  if (!metrics) {
    return {
      supported: false,
      type: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
      source: 'none',
    };
  }

  const browserInfo = parseBrowserInfo();
  const inferred = inferConnectionType(metrics, browserInfo);

  return {
    supported: false,
    type: inferred.type,
    effectiveType: inferred.effectiveType,
    downlink: metrics.downlink ?? null,
    rtt: metrics.rtt ?? null,
    source: 'heuristic',
  };
}
