/**
 * Network connection detection using the Network Information API.
 *
 * Reads `navigator.connection` properties (type, effectiveType, downlink, rtt)
 * to identify the user's current network. Returns a snapshot object and
 * exposes a listener for real-time connection changes.
 *
 * Browsers without Network Information API support receive a graceful
 * fallback with all values set to `null` and `supported: false`.
 */

/**
 * @typedef {object} ConnectionInfo
 * @property {boolean} supported - Whether the Network Information API is available.
 * @property {string|null} type - Physical connection type (e.g. 'wifi', 'cellular', 'ethernet', 'bluetooth', 'none').
 * @property {string|null} effectiveType - Effective connection quality ('slow-2g', '2g', '3g', '4g').
 * @property {number|null} downlink - Estimated downlink bandwidth in Mbps.
 * @property {number|null} rtt - Estimated round-trip time in milliseconds.
 */

/** Default snapshot returned when the API is not available. */
const UNSUPPORTED_INFO = Object.freeze({
  supported: false,
  type: null,
  effectiveType: null,
  downlink: null,
  rtt: null,
});

/**
 * Returns the `NetworkInformation` object if available, or `null`.
 *
 * @returns {NetworkInformation|null}
 */
export function getConnectionAPI() {
  if (typeof navigator === 'undefined') return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

/**
 * Reads the current network connection properties.
 *
 * @returns {ConnectionInfo} A snapshot of the current connection state.
 */
export function getConnectionInfo() {
  const conn = getConnectionAPI();
  if (!conn) return { ...UNSUPPORTED_INFO };

  return {
    supported: true,
    type: conn.type ?? null,
    effectiveType: conn.effectiveType ?? null,
    downlink: typeof conn.downlink === 'number' ? conn.downlink : null,
    rtt: typeof conn.rtt === 'number' ? conn.rtt : null,
  };
}

/**
 * Subscribes to connection change events.
 *
 * Calls `callback` immediately with the current state, then again
 * each time the connection changes. Returns a cleanup function to
 * remove the listener.
 *
 * @param {(info: ConnectionInfo) => void} callback - Invoked on each change.
 * @returns {() => void} Unsubscribe function.
 */
export function onConnectionChange(callback) {
  // Deliver the initial state synchronously.
  callback(getConnectionInfo());

  const conn = getConnectionAPI();
  if (!conn) {
    // No API → nothing to listen to; return a no-op unsubscribe.
    return () => {};
  }

  const handler = () => callback(getConnectionInfo());
  conn.addEventListener('change', handler);

  return () => conn.removeEventListener('change', handler);
}
