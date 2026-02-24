/**
 * Upload speed measurement via POST of random data.
 *
 * Sends payloads of increasing size (512 KB → 2 MB → 5 MB) to the
 * local test server, measures throughput for each stage, and returns
 * the final speed estimate in Mbps.
 */

/** Default progressive upload stages (bytes). */
const DEFAULT_STAGES = [
  524_288,    // 512 KB
  2_097_152,  // 2 MB
  5_242_880,  // 5 MB
];

const DEFAULT_OPTIONS = {
  /** URL for the upload endpoint. */
  url: '/upload',
  /** Per-stage timeout in milliseconds. */
  timeout: 30_000,
  /** Ordered list of byte sizes for each upload stage. */
  stages: DEFAULT_STAGES,
};

/**
 * Generates a Uint8Array filled with random values.
 *
 * Uses crypto.getRandomValues in chunks (max 65 536 bytes per call).
 *
 * @param {number} size - Number of bytes.
 * @returns {Uint8Array}
 */
function generatePayload(size) {
  const buffer = new Uint8Array(size);
  const CHUNK = 65_536;
  for (let offset = 0; offset < size; offset += CHUNK) {
    const end = Math.min(offset + CHUNK, size);
    crypto.getRandomValues(buffer.subarray(offset, end));
  }
  return buffer;
}

/**
 * Measures upload speed for a single stage.
 *
 * @param {string} url - Upload endpoint URL.
 * @param {number} bytes - Number of bytes to upload.
 * @param {number} timeout - Abort after this many ms.
 * @param {AbortSignal} [signal] - External abort signal.
 * @returns {Promise<{ bytes: number, durationMs: number, mbps: number }>}
 */
async function measureSingleUpload(url, bytes, timeout, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const bustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const payload = generatePayload(bytes);

  const start = performance.now();
  try {
    await fetch(bustUrl, {
      method: 'POST',
      cache: 'no-store',
      body: payload,
      signal: controller.signal,
    });
    const end = performance.now();

    const durationMs = end - start;
    const mbps = bytesToMbps(bytes, durationMs);

    return { bytes, durationMs, mbps };
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
 * Runs a full upload speed measurement with progressive stages.
 *
 * Uploads payloads of increasing size and computes the weighted average
 * speed across all stages. Early stages act as warm-up; later stages
 * with larger payloads provide more accurate measurements.
 *
 * @param {object} [options]
 * @param {string} [options.url] - Upload endpoint.
 * @param {number} [options.timeout] - Per-stage timeout in ms.
 * @param {number[]} [options.stages] - Array of byte sizes for each stage.
 * @param {(progress: { stage: number, totalStages: number, stageMbps: number, stageBytes: number }) => void} [options.onProgress]
 *   Called after each stage completes.
 * @param {AbortSignal} [options.signal] - External abort signal to cancel the measurement.
 * @returns {Promise<{ speedMbps: number, stages: Array<{ bytes: number, durationMs: number, mbps: number }> }>}
 * @throws {Error} If all stages fail or the measurement is aborted.
 */
export async function measureUploadSpeed(options = {}) {
  const { url, timeout, stages } = { ...DEFAULT_OPTIONS, ...options };
  const { onProgress, signal } = options;

  const results = [];

  for (let i = 0; i < stages.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Upload measurement aborted', 'AbortError');
    }

    const stageBytes = stages[i];

    try {
      const result = await measureSingleUpload(url, stageBytes, timeout, signal);
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
      if (signal?.aborted) {
        throw new DOMException('Upload measurement aborted', 'AbortError');
      }
    }
  }

  if (results.length === 0) {
    throw new Error('All upload stages failed. Check your network connection.');
  }

  const speedMbps = computeWeightedSpeed(results);

  return { speedMbps, stages: results };
}

/**
 * Computes a weighted average speed from stage results.
 *
 * Uses total bytes / total time across all stages, which naturally
 * gives more weight to larger uploads (the most accurate samples).
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
