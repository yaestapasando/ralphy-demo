/**
 * SpeedTest orchestrator — coordinates ping, download, and upload
 * measurements while updating the gauge in real time.
 *
 * Phases run sequentially: ping → download → upload.
 * The gauge reflects the current measurement value as each phase progresses.
 */

import { measureLatency } from '../services/ping.js';
import { measureDownloadSpeed } from '../services/download.js';
import { measureUploadSpeed } from '../services/upload.js';
import { classifyError, SpeedTestError } from '../services/errors.js';

/** Test phases in execution order. */
export const PHASES = ['ping', 'download', 'upload'];

/**
 * @typedef {object} SpeedTestResult
 * @property {number} ping - Average latency in ms.
 * @property {number} jitter - Jitter (std dev of latency) in ms.
 * @property {number} download - Download speed in Mbps.
 * @property {number} upload - Upload speed in Mbps.
 */

/**
 * @typedef {object} SpeedTestCallbacks
 * @property {(phase: string) => void} [onPhaseStart] - Called when a phase begins.
 * @property {(phase: string, value: number) => void} [onProgress] - Called with the latest value during a phase.
 * @property {(phase: string, result: object) => void} [onPhaseEnd] - Called when a phase completes.
 * @property {(result: SpeedTestResult) => void} [onComplete] - Called with final results.
 * @property {(error: Error) => void} [onError] - Called if the test fails.
 */

/**
 * Runs a full speed test (ping → download → upload) and reports progress
 * via callbacks suitable for driving a gauge UI.
 *
 * @param {SpeedTestCallbacks} [callbacks] - Lifecycle callbacks.
 * @param {AbortSignal} [signal] - External abort signal.
 * @returns {Promise<SpeedTestResult>}
 */
export async function runSpeedTest(callbacks = {}, signal) {
  const { onPhaseStart, onProgress, onPhaseEnd, onComplete, onError } = callbacks;

  const result = {
    ping: 0,
    jitter: 0,
    download: 0,
    upload: 0,
  };

  try {
    // --- Phase 1: Ping ---
    onPhaseStart?.('ping');

    const pingResult = await measureLatency({
      signal,
      onProgress: ({ lastPing }) => {
        onProgress?.('ping', lastPing);
      },
    });

    result.ping = pingResult.avg;
    result.jitter = pingResult.jitter;
    onPhaseEnd?.('ping', { avg: pingResult.avg, jitter: pingResult.jitter });

    // --- Phase 2: Download ---
    onPhaseStart?.('download');

    const dlResult = await measureDownloadSpeed({
      signal,
      onProgress: ({ stageMbps }) => {
        onProgress?.('download', stageMbps);
      },
    });

    result.download = dlResult.speedMbps;
    onPhaseEnd?.('download', { speedMbps: dlResult.speedMbps });

    // --- Phase 3: Upload ---
    onPhaseStart?.('upload');

    const ulResult = await measureUploadSpeed({
      signal,
      onProgress: ({ stageMbps }) => {
        onProgress?.('upload', stageMbps);
      },
    });

    result.upload = ulResult.speedMbps;
    onPhaseEnd?.('upload', { speedMbps: ulResult.speedMbps });

    onComplete?.(result);
    return result;
  } catch (err) {
    const classified = err instanceof SpeedTestError ? err : classifyError(err);
    onError?.(classified);
    throw classified;
  }
}
