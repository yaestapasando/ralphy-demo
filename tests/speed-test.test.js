import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSpeedTest, PHASES } from '../src/components/speed-test.js';

// Mock the measurement services
vi.mock('../src/services/ping.js', () => ({
  measureLatency: vi.fn(),
}));
vi.mock('../src/services/download.js', () => ({
  measureDownloadSpeed: vi.fn(),
}));
vi.mock('../src/services/upload.js', () => ({
  measureUploadSpeed: vi.fn(),
}));

// Import mocked modules
import { measureLatency } from '../src/services/ping.js';
import { measureDownloadSpeed } from '../src/services/download.js';
import { measureUploadSpeed } from '../src/services/upload.js';

// ---------------------------------------------------------------------------
// PHASES constant
// ---------------------------------------------------------------------------

describe('PHASES', () => {
  it('contains ping, download, upload in order', () => {
    expect(PHASES).toEqual(['ping', 'download', 'upload']);
  });
});

// ---------------------------------------------------------------------------
// runSpeedTest – orchestrator tests
// ---------------------------------------------------------------------------

describe('runSpeedTest', () => {
  const pingResult = { avg: 12.5, min: 10, max: 15, jitter: 1.8, samples: [10, 12, 15] };
  const downloadResult = { speedMbps: 95.4, stages: [{ bytes: 1048576, durationMs: 100, mbps: 83.89 }] };
  const uploadResult = { speedMbps: 42.1, stages: [{ bytes: 524288, durationMs: 100, mbps: 41.94 }] };

  beforeEach(() => {
    vi.clearAllMocks();
    measureLatency.mockResolvedValue(pingResult);
    measureDownloadSpeed.mockResolvedValue(downloadResult);
    measureUploadSpeed.mockResolvedValue(uploadResult);
  });

  it('runs all three phases and returns combined result', async () => {
    const result = await runSpeedTest();

    expect(result.ping).toBe(12.5);
    expect(result.jitter).toBe(1.8);
    expect(result.download).toBe(95.4);
    expect(result.upload).toBe(42.1);
  });

  it('calls measurement services in order: ping → download → upload', async () => {
    const callOrder = [];
    measureLatency.mockImplementation(async () => {
      callOrder.push('ping');
      return pingResult;
    });
    measureDownloadSpeed.mockImplementation(async () => {
      callOrder.push('download');
      return downloadResult;
    });
    measureUploadSpeed.mockImplementation(async () => {
      callOrder.push('upload');
      return uploadResult;
    });

    await runSpeedTest();

    expect(callOrder).toEqual(['ping', 'download', 'upload']);
  });

  it('calls onPhaseStart for each phase', async () => {
    const onPhaseStart = vi.fn();
    await runSpeedTest({ onPhaseStart });

    expect(onPhaseStart).toHaveBeenCalledTimes(3);
    expect(onPhaseStart).toHaveBeenNthCalledWith(1, 'ping');
    expect(onPhaseStart).toHaveBeenNthCalledWith(2, 'download');
    expect(onPhaseStart).toHaveBeenNthCalledWith(3, 'upload');
  });

  it('calls onPhaseEnd with results for each phase', async () => {
    const onPhaseEnd = vi.fn();
    await runSpeedTest({ onPhaseEnd });

    expect(onPhaseEnd).toHaveBeenCalledTimes(3);
    expect(onPhaseEnd).toHaveBeenNthCalledWith(1, 'ping', { avg: 12.5, jitter: 1.8 });
    expect(onPhaseEnd).toHaveBeenNthCalledWith(2, 'download', { speedMbps: 95.4 });
    expect(onPhaseEnd).toHaveBeenNthCalledWith(3, 'upload', { speedMbps: 42.1 });
  });

  it('calls onComplete with the final result', async () => {
    const onComplete = vi.fn();
    await runSpeedTest({ onComplete });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      ping: 12.5,
      jitter: 1.8,
      download: 95.4,
      upload: 42.1,
    });
  });

  it('forwards progress callbacks for the ping phase', async () => {
    const onProgress = vi.fn();
    measureLatency.mockImplementation(async (opts) => {
      opts.onProgress({ current: 1, total: 10, lastPing: 11.5 });
      opts.onProgress({ current: 2, total: 10, lastPing: 13.2 });
      return pingResult;
    });

    await runSpeedTest({ onProgress });

    expect(onProgress).toHaveBeenCalledWith('ping', 11.5);
    expect(onProgress).toHaveBeenCalledWith('ping', 13.2);
  });

  it('forwards progress callbacks for the download phase', async () => {
    const onProgress = vi.fn();
    measureDownloadSpeed.mockImplementation(async (opts) => {
      opts.onProgress({ stage: 1, totalStages: 3, stageMbps: 80.5, stageBytes: 1048576 });
      return downloadResult;
    });

    await runSpeedTest({ onProgress });

    expect(onProgress).toHaveBeenCalledWith('download', 80.5);
  });

  it('forwards progress callbacks for the upload phase', async () => {
    const onProgress = vi.fn();
    measureUploadSpeed.mockImplementation(async (opts) => {
      opts.onProgress({ stage: 1, totalStages: 3, stageMbps: 38.2, stageBytes: 524288 });
      return uploadResult;
    });

    await runSpeedTest({ onProgress });

    expect(onProgress).toHaveBeenCalledWith('upload', 38.2);
  });

  it('passes the abort signal to all measurement services', async () => {
    const controller = new AbortController();

    await runSpeedTest({}, controller.signal);

    expect(measureLatency).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(measureDownloadSpeed).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(measureUploadSpeed).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('calls onError when ping phase fails', async () => {
    const error = new Error('All ping requests failed.');
    measureLatency.mockRejectedValue(error);
    const onError = vi.fn();

    await expect(runSpeedTest({ onError })).rejects.toThrow('All ping requests failed.');
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('calls onError when download phase fails', async () => {
    const error = new Error('All download stages failed.');
    measureDownloadSpeed.mockRejectedValue(error);
    const onError = vi.fn();

    await expect(runSpeedTest({ onError })).rejects.toThrow('All download stages failed.');
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('calls onError when upload phase fails', async () => {
    const error = new Error('All upload stages failed.');
    measureUploadSpeed.mockRejectedValue(error);
    const onError = vi.fn();

    await expect(runSpeedTest({ onError })).rejects.toThrow('All upload stages failed.');
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('does not call later phases if an early phase fails', async () => {
    measureLatency.mockRejectedValue(new Error('ping failed'));

    await expect(runSpeedTest()).rejects.toThrow('ping failed');

    expect(measureDownloadSpeed).not.toHaveBeenCalled();
    expect(measureUploadSpeed).not.toHaveBeenCalled();
  });

  it('works without any callbacks', async () => {
    const result = await runSpeedTest();

    expect(result).toEqual({
      ping: 12.5,
      jitter: 1.8,
      download: 95.4,
      upload: 42.1,
    });
  });

  it('propagates AbortError from aborted signal', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    measureLatency.mockRejectedValue(abortError);
    const onError = vi.fn();

    await expect(runSpeedTest({ onError })).rejects.toThrow();
    expect(onError).toHaveBeenCalledWith(abortError);
  });
});
