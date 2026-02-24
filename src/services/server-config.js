/**
 * Server endpoint configuration for speed-test measurements.
 *
 * All test traffic is routed to the local Vite dev server plugin
 * (vite-plugin-test-server.js) which provides /ping, /download,
 * and /upload endpoints — removing any external dependency.
 */

const DEFAULT_CONFIG = {
  /** Endpoint for latency (ping) measurement. HEAD requests return 204. */
  pingUrl: '/ping',
  /** Endpoint for download speed measurement. Streams random bytes. */
  downloadUrl: '/download',
  /** Endpoint for upload speed measurement. Accepts POST body. */
  uploadUrl: '/upload',
};

/**
 * Returns the current server endpoint configuration.
 *
 * @param {object} [overrides] - Optional partial overrides.
 * @returns {{ pingUrl: string, downloadUrl: string, uploadUrl: string }}
 */
export function getServerConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...overrides };
}

/**
 * Builds a download URL with the requested byte size as a query parameter.
 *
 * @param {number} bytes - Number of bytes to download.
 * @param {string} [baseUrl] - Base download endpoint.
 * @returns {string}
 */
export function buildDownloadUrl(bytes, baseUrl = DEFAULT_CONFIG.downloadUrl) {
  return `${baseUrl}?bytes=${bytes}`;
}
