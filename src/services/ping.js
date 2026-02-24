/**
 * Latency (ping) measurement via repeated HTTP requests.
 *
 * Sends a configurable number of small HEAD requests to the test server,
 * measures round-trip time for each, and computes statistics.
 */

const DEFAULT_OPTIONS = {
  /** URL to ping (should respond fast with minimal payload). */
  url: '/ping',
  /** Number of ping requests to send. */
  count: 10,
  /** Timeout per request in milliseconds. */
  timeout: 5000,
  /** Delay between requests in milliseconds (avoids bursting). */
  delay: 200,
};

/**
 * Measures a single HTTP round-trip time.
 *
 * @param {string} url - The endpoint to request.
 * @param {number} timeout - Abort after this many ms.
 * @returns {Promise<number>} Round-trip time in milliseconds.
 */
async function measureSinglePing(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // Append a cache-busting query param to avoid cached responses.
  const bustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;

  const start = performance.now();
  try {
    await fetch(bustUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const end = performance.now();

  return end - start;
}

/**
 * Waits for the specified number of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Computes ping statistics from an array of RTT samples.
 *
 * @param {number[]} samples - Array of RTT values in ms.
 * @returns {{ avg: number, min: number, max: number, jitter: number, samples: number[] }}
 */
export function computePingStats(samples) {
  if (samples.length === 0) {
    return { avg: 0, min: 0, max: 0, jitter: 0, samples: [] };
  }

  const sum = samples.reduce((a, b) => a + b, 0);
  const avg = sum / samples.length;
  const min = Math.min(...samples);
  const max = Math.max(...samples);

  // Jitter = mean absolute difference between consecutive samples (RFC 3550 style).
  let jitter = 0;
  if (samples.length > 1) {
    let totalDiff = 0;
    for (let i = 1; i < samples.length; i++) {
      totalDiff += Math.abs(samples[i] - samples[i - 1]);
    }
    jitter = totalDiff / (samples.length - 1);
  }

  return {
    avg: round2(avg),
    min: round2(min),
    max: round2(max),
    jitter: round2(jitter),
    samples: samples.map(round2),
  };
}

/**
 * Rounds a number to 2 decimal places.
 *
 * @param {number} n
 * @returns {number}
 */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Runs a full latency measurement: sends `count` pings and returns statistics.
 *
 * @param {object} [options]
 * @param {string} [options.url] - Endpoint to ping.
 * @param {number} [options.count] - Number of requests.
 * @param {number} [options.timeout] - Per-request timeout in ms.
 * @param {number} [options.delay] - Delay between requests in ms.
 * @param {(progress: { current: number, total: number, lastPing: number }) => void} [options.onProgress]
 *   Called after each ping completes.
 * @param {AbortSignal} [options.signal] - External abort signal to cancel the measurement.
 * @returns {Promise<{ avg: number, min: number, max: number, jitter: number, samples: number[] }>}
 * @throws {Error} If all pings fail or the measurement is aborted.
 */
export async function measureLatency(options = {}) {
  const { url, count, timeout, delay } = { ...DEFAULT_OPTIONS, ...options };
  const { onProgress, signal } = options;

  const samples = [];

  for (let i = 0; i < count; i++) {
    if (signal?.aborted) {
      throw new DOMException('Latency measurement aborted', 'AbortError');
    }

    try {
      const rtt = await measureSinglePing(url, timeout);
      samples.push(rtt);

      if (onProgress) {
        onProgress({ current: i + 1, total: count, lastPing: round2(rtt) });
      }
    } catch (_err) {
      // If the external signal caused the abort, re-throw immediately.
      if (signal?.aborted) {
        throw new DOMException('Latency measurement aborted', 'AbortError');
      }
      // Individual ping failures are tolerated; we just skip the sample.
    }

    // Wait between pings (skip delay after the last one).
    if (i < count - 1 && delay > 0) {
      await sleep(delay);
    }
  }

  if (samples.length === 0) {
    throw new Error('All ping requests failed. Check your network connection.');
  }

  return computePingStats(samples);
}
