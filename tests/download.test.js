import { describe, it, expect, vi, beforeEach } from 'vitest';
import { measureDownloadSpeed, computeWeightedSpeed, bytesToMbps, DEFAULT_STAGES } from '../src/services/download.js';

// ---------------------------------------------------------------------------
// bytesToMbps – pure function tests
// ---------------------------------------------------------------------------

describe('bytesToMbps', () => {
  it('converts bytes and duration to Mbps', () => {
    // 1 MB in 1 second = 8 Mbps
    const result = bytesToMbps(1_048_576, 1000);
    expect(result).toBe(8.39);
  });

  it('returns 0 when duration is 0', () => {
    expect(bytesToMbps(1000, 0)).toBe(0);
  });

  it('returns 0 when duration is negative', () => {
    expect(bytesToMbps(1000, -100)).toBe(0);
  });

  it('handles large file sizes correctly', () => {
    // 25 MB in 2 seconds = 100 Mbps
    const result = bytesToMbps(26_214_400, 2000);
    expect(result).toBe(104.86);
  });
});

// ---------------------------------------------------------------------------
// computeWeightedSpeed – pure function tests
// ---------------------------------------------------------------------------

describe('computeWeightedSpeed', () => {
  it('returns 0 for empty stages', () => {
    expect(computeWeightedSpeed([])).toBe(0);
  });

  it('returns speed for a single stage', () => {
    const stages = [{ bytes: 1_048_576, durationMs: 1000, mbps: 8.39 }];
    const result = computeWeightedSpeed(stages);
    expect(result).toBe(8.39);
  });

  it('computes weighted average favoring larger downloads', () => {
    // Stage 1: 1 MB in 500ms = ~16.78 Mbps
    // Stage 2: 10 MB in 2000ms = ~41.94 Mbps
    // Total: 11 MB in 2500ms → weighted = ~36.91 Mbps
    const stages = [
      { bytes: 1_048_576, durationMs: 500, mbps: 16.78 },
      { bytes: 10_485_760, durationMs: 2000, mbps: 41.94 },
    ];
    const result = computeWeightedSpeed(stages);
    // totalBytes = 11534336, totalMs = 2500
    // bits = 92274688, seconds = 2.5
    // mbps = 92274688 / 2500000 / 1000000 → wait let me compute properly
    // bits = 11534336 * 8 = 92274688
    // seconds = 2.5
    // mbps = 92274688 / 2500000 = nope
    // mbps = 92274688 / 1000000 / 2.5 = 36.91
    expect(result).toBe(36.91);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_STAGES – constant verification
// ---------------------------------------------------------------------------

describe('DEFAULT_STAGES', () => {
  it('contains three progressive sizes (1MB, 10MB, 25MB)', () => {
    expect(DEFAULT_STAGES).toEqual([1_048_576, 10_485_760, 26_214_400]);
  });

  it('stages are in ascending order', () => {
    for (let i = 1; i < DEFAULT_STAGES.length; i++) {
      expect(DEFAULT_STAGES[i]).toBeGreaterThan(DEFAULT_STAGES[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// measureDownloadSpeed – integration tests with mocked fetch
// ---------------------------------------------------------------------------

describe('measureDownloadSpeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to create a mock fetch that returns an ArrayBuffer of the requested size.
   * Uses the bytes query param from the URL to determine size.
   */
  function createFetchMock(timingPairs) {
    let callCount = 0;
    // Mock performance.now to return controlled timing.
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return timingPairs[callCount++] ?? 0;
    });

    return vi.fn().mockImplementation((url) => {
      const urlObj = new URL(url, 'http://localhost');
      const bytes = parseInt(urlObj.searchParams.get('bytes'), 10) || 1_048_576;
      const buffer = new ArrayBuffer(bytes);
      return Promise.resolve(new Response(buffer));
    });
  }

  it('downloads all three default stages and returns results', async () => {
    // 3 stages × 2 calls to performance.now (start + end) = 6 values
    const timings = [
      0, 500,      // Stage 1: 500ms
      500, 2500,   // Stage 2: 2000ms
      2500, 6500,  // Stage 3: 4000ms
    ];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureDownloadSpeed({ timeout: 60000 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.stages).toHaveLength(3);
    expect(result.speedMbps).toBeGreaterThan(0);
    expect(typeof result.speedMbps).toBe('number');
  });

  it('uses cache-busting query parameter on each fetch', async () => {
    const timings = [0, 100, 100, 200, 200, 300];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    await measureDownloadSpeed({ stages: [1024, 2048, 4096], timeout: 60000 });

    for (const [calledUrl] of fetchMock.mock.calls) {
      expect(calledUrl).toMatch(/&t=\d+$/);
    }
  });

  it('uses no-store cache policy', async () => {
    const timings = [0, 100];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    await measureDownloadSpeed({ stages: [1024], timeout: 60000 });

    const fetchOptions = fetchMock.mock.calls[0][1];
    expect(fetchOptions.cache).toBe('no-store');
  });

  it('calls onProgress after each stage', async () => {
    const timings = [0, 100, 100, 200, 200, 300];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const onProgress = vi.fn();
    await measureDownloadSpeed({
      stages: [1024, 2048, 4096],
      timeout: 60000,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress.mock.calls[0][0]).toMatchObject({ stage: 1, totalStages: 3 });
    expect(onProgress.mock.calls[1][0]).toMatchObject({ stage: 2, totalStages: 3 });
    expect(onProgress.mock.calls[2][0]).toMatchObject({ stage: 3, totalStages: 3 });
    expect(typeof onProgress.mock.calls[0][0].stageMbps).toBe('number');
    expect(typeof onProgress.mock.calls[0][0].stageBytes).toBe('number');
  });

  it('tolerates individual stage failures', async () => {
    let callNum = 0;
    // Stage 2 fails, stages 1 and 3 succeed.
    let perfCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (perfCount++) * 100;
    });

    const fetchMock = vi.fn().mockImplementation(() => {
      callNum++;
      if (callNum === 2) return Promise.reject(new Error('Network error'));
      const buffer = new ArrayBuffer(1024);
      return Promise.resolve(new Response(buffer));
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureDownloadSpeed({
      stages: [1024, 2048, 4096],
      timeout: 60000,
    });

    expect(result.stages).toHaveLength(2);
    expect(result.speedMbps).toBeGreaterThan(0);
  });

  it('throws when all stages fail', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureDownloadSpeed({ stages: [1024, 2048], timeout: 60000 })
    ).rejects.toThrow('All download stages failed');
  });

  it('respects external abort signal (already aborted)', async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = vi.fn().mockResolvedValue(new Response(new ArrayBuffer(0)));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureDownloadSpeed({
        stages: [1024],
        timeout: 60000,
        signal: controller.signal,
      })
    ).rejects.toSatisfy((err) => err.name === 'AbortError');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts mid-measurement when signal fires', async () => {
    const controller = new AbortController();
    let callNum = 0;
    let perfCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (perfCount++) * 100;
    });

    const fetchMock = vi.fn().mockImplementation(() => {
      callNum++;
      if (callNum === 2) {
        controller.abort();
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      }
      const buffer = new ArrayBuffer(1024);
      return Promise.resolve(new Response(buffer));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureDownloadSpeed({
        stages: [1024, 2048, 4096],
        timeout: 60000,
        signal: controller.signal,
      })
    ).rejects.toSatisfy((err) => err.name === 'AbortError');
  });

  it('uses default options when none provided', async () => {
    let perfCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (perfCount++) * 500;
    });

    const fetchMock = vi.fn().mockImplementation((url) => {
      const urlObj = new URL(url, 'http://localhost');
      const bytes = parseInt(urlObj.searchParams.get('bytes'), 10) || 1024;
      const buffer = new ArrayBuffer(bytes);
      return Promise.resolve(new Response(buffer));
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureDownloadSpeed();

    // Default: 3 stages
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.stages).toHaveLength(3);
  });

  it('uses custom stages when provided', async () => {
    let perfCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (perfCount++) * 100;
    });

    const fetchMock = vi.fn().mockImplementation(() => {
      const buffer = new ArrayBuffer(512);
      return Promise.resolve(new Response(buffer));
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureDownloadSpeed({
      stages: [512, 1024],
      timeout: 60000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.stages).toHaveLength(2);
  });

  it('builds correct download URLs with bytes parameter', async () => {
    let perfCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (perfCount++) * 100;
    });

    const fetchMock = vi.fn().mockImplementation(() => {
      const buffer = new ArrayBuffer(1024);
      return Promise.resolve(new Response(buffer));
    });
    vi.stubGlobal('fetch', fetchMock);

    await measureDownloadSpeed({
      url: '/download',
      stages: [1_048_576, 10_485_760],
      timeout: 60000,
    });

    expect(fetchMock.mock.calls[0][0]).toMatch(/^\/download\?bytes=1048576&t=\d+$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/^\/download\?bytes=10485760&t=\d+$/);
  });

  it('each stage result contains bytes, durationMs, and mbps', async () => {
    const timings = [0, 1000]; // 1 second
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureDownloadSpeed({
      stages: [1_048_576],
      timeout: 60000,
    });

    const stage = result.stages[0];
    expect(stage).toHaveProperty('bytes');
    expect(stage).toHaveProperty('durationMs');
    expect(stage).toHaveProperty('mbps');
    expect(stage.bytes).toBe(1_048_576);
    expect(stage.durationMs).toBe(1000);
    expect(stage.mbps).toBe(8.39); // 1 MB * 8 bits / 1 second / 1_000_000
  });

  it('computes correct weighted speed across stages', async () => {
    // Stage 1: 1MB in 500ms
    // Stage 2: 10MB in 2000ms
    // Total: ~11MB in 2500ms
    const timings = [0, 500, 500, 2500];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureDownloadSpeed({
      stages: [1_048_576, 10_485_760],
      timeout: 60000,
    });

    // Weighted speed = total bytes * 8 / total seconds / 1_000_000
    const totalBytes = 1_048_576 + 10_485_760;
    const totalBits = totalBytes * 8;
    const totalSeconds = 2.5;
    const expectedMbps = Math.round((totalBits / totalSeconds / 1_000_000) * 100) / 100;

    expect(result.speedMbps).toBe(expectedMbps);
  });
});
