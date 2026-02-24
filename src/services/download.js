/**
 * Download speed measurement via progressive file downloads.
 *
 * Downloads files of increasing size (1 MB → 10 MB → 25 MB) from the
 * local test server, measures throughput for each stage, and returns
 * the final speed estimate in Mbps.
 */

import { buildDownloadUrl } from './server-config.js';
import {
  SpeedTestError, ErrorCode, assertResponseOk, isTimeoutError,
} from './errors.js';

/** Default progressive download stages (bytes). */
const DEFAULT_STAGES = [
  1_048_576,   // 1 MB
  10_485_760,  // 10 MB
  26_214_400,  // 25 MB
];

const DEFAULT_OPTIONS = {
  /** Base URL for the download endpoint. */
  url: '/download',
  /** Per-stage timeout in milliseconds. */
  timeout: 30_000,
  /** Ordered list of byte sizes for each download stage. */
  stages: DEFAULT_STAGES,
};

/**
 * Measures download speed for a single stage.
 *
 * @param {string} url - Full download URL with bytes query param.
 * @param {number} expectedBytes - Expected payload size in bytes.
 * @param {number} timeout - Abort after this many ms.
 * @param {AbortSignal} [signal] - External abort signal.
 * @returns {Promise<{ bytes: number, durationMs: number, mbps: number }>}
 */
async function measureSingleDownload(url, expectedBytes, timeout, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // If an external signal is provided, forward its abort.
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const bustUrl = `${url}&t=${Date.now()}`;

  const start = performance.now();
  try {
    const response = await fetch(bustUrl, {
      cache: 'no-store',
      signal: controller.signal,
    });

    assertResponseOk(response, 'download');

    // Consume the entire response body to ensure full download.
    const buffer = await response.arrayBuffer();
    const end = performance.now();

    const bytes = buffer.byteLength;
    const durationMs = end - start;
    const mbps = bytesToMbps(bytes, durationMs);

    return { bytes, durationMs, mbps };
  } catch (err) {
    if (isTimeoutError(err, signal)) {
      throw new SpeedTestError(ErrorCode.TIMEOUT, undefined, { cause: err, phase: 'download' });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Converts bytes transferred over a duration to megabits per second.
 *
 * @param {number} bytes
 * @param {number} durationMs
 * @returns {number} Speed in Mbps.
 */
function bytesToMbps(bytes, durationMs) {
  if (durationMs <= 0) return 0;
  const bits = bytes * 8;
  const seconds = durationMs / 1000;
  return round2(bits / seconds / 1_000_000);
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
 * Runs a full download speed measurement with progressive stages.
 *
 * Downloads files of increasing size and computes the weighted average
 * speed across all stages. Early stages act as warm-up; later stages
 * with larger payloads provide more accurate measurements.
 *
 * @param {object} [options]
 * @param {string} [options.url] - Base download endpoint.
 * @param {number} [options.timeout] - Per-stage timeout in ms.
 * @param {number[]} [options.stages] - Array of byte sizes for each stage.
 * @param {(progress: { stage: number, totalStages: number, stageMbps: number, stageBytes: number }) => void} [options.onProgress]
 *   Called after each stage completes.
 * @param {AbortSignal} [options.signal] - External abort signal to cancel the measurement.
 * @returns {Promise<{ speedMbps: number, stages: Array<{ bytes: number, durationMs: number, mbps: number }> }>}
 * @throws {Error} If all stages fail or the measurement is aborted.
 */
export async function measureDownloadSpeed(options = {}) {
  const { url, timeout, stages } = { ...DEFAULT_OPTIONS, ...options };
  const { onProgress, signal } = options;

  const results = [];

  for (let i = 0; i < stages.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Download measurement aborted', 'AbortError');
    }

    const stageBytes = stages[i];
    const downloadUrl = buildDownloadUrl(stageBytes, url);

    try {
      const result = await measureSingleDownload(downloadUrl, stageBytes, timeout, signal);
      results.push(result);

      if (onProgress) {
        onProgress({
          stage: i + 1,
          totalStages: stages.length,
          stageMbps: result.mbps,
          stageBytes: result.bytes,
        });
      }
    } catch (_err) {
      // If the external signal caused the abort, re-throw immediately.
      if (signal?.aborted) {
        throw new DOMException('Download measurement aborted', 'AbortError');
      }
      // Individual stage failures are tolerated; we skip the stage.
    }
  }

  if (results.length === 0) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new SpeedTestError(ErrorCode.OFFLINE, undefined, { phase: 'download' });
    }
    throw new SpeedTestError(
      ErrorCode.NETWORK_ERROR,
      'All download stages failed. Check your network connection.',
      { phase: 'download' },
    );
  }

  const speedMbps = computeWeightedSpeed(results);

  return { speedMbps, stages: results };
}

/**
 * Computes a weighted average speed from stage results.
 *
 * Uses total bytes / total time across all stages, which naturally
 * gives more weight to larger downloads (the most accurate samples).
 *
 * @param {Array<{ bytes: number, durationMs: number, mbps: number }>} stages
 * @returns {number} Weighted speed in Mbps.
 */
export function computeWeightedSpeed(stages) {
  if (stages.length === 0) return 0;

  const totalBytes = stages.reduce((sum, s) => sum + s.bytes, 0);
  const totalMs = stages.reduce((sum, s) => sum + s.durationMs, 0);

  return bytesToMbps(totalBytes, totalMs);
}

export { bytesToMbps, DEFAULT_STAGES };
