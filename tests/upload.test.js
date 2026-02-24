import { describe, it, expect, vi, beforeEach } from 'vitest';
import { measureUploadSpeed, computeWeightedSpeed, bytesToMbps, DEFAULT_STAGES } from '../src/services/upload.js';

// ---------------------------------------------------------------------------
// bytesToMbps – pure function tests
// ---------------------------------------------------------------------------

describe('bytesToMbps', () => {
  it('converts bytes and duration to Mbps', () => {
    // 1 MB in 1 second = 8.39 Mbps
    const result = bytesToMbps(1_048_576, 1000);
    expect(result).toBe(8.39);
  });

  it('returns 0 when duration is 0', () => {
    expect(bytesToMbps(1000, 0)).toBe(0);
  });

  it('returns 0 when duration is negative', () => {
    expect(bytesToMbps(1000, -100)).toBe(0);
  });

  it('handles large payloads correctly', () => {
    // 5 MB in 1 second = 41.94 Mbps
    const result = bytesToMbps(5_242_880, 1000);
    expect(result).toBe(41.94);
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

  it('computes weighted average favoring larger uploads', () => {
    // Stage 1: 512 KB in 250ms
    // Stage 2: 2 MB in 1000ms
    // Total: ~2.5 MB in 1250ms
    const stages = [
      { bytes: 524_288, durationMs: 250, mbps: 16.78 },
      { bytes: 2_097_152, durationMs: 1000, mbps: 16.78 },
    ];
    const result = computeWeightedSpeed(stages);
    const totalBytes = 524_288 + 2_097_152;
    const totalBits = totalBytes * 8;
    const totalSeconds = 1.25;
    const expectedMbps = Math.round((totalBits / totalSeconds / 1_000_000) * 100) / 100;
    expect(result).toBe(expectedMbps);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_STAGES – constant verification
// ---------------------------------------------------------------------------

describe('DEFAULT_STAGES', () => {
  it('contains three progressive sizes (512KB, 2MB, 5MB)', () => {
    expect(DEFAULT_STAGES).toEqual([524_288, 2_097_152, 5_242_880]);
  });

  it('stages are in ascending order', () => {
    for (let i = 1; i < DEFAULT_STAGES.length; i++) {
      expect(DEFAULT_STAGES[i]).toBeGreaterThan(DEFAULT_STAGES[i - 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// measureUploadSpeed – integration tests with mocked fetch
// ---------------------------------------------------------------------------

describe('measureUploadSpeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Stub crypto.getRandomValues to avoid actual random generation in tests.
    vi.stubGlobal('crypto', {
      getRandomValues: (buffer) => buffer,
    });
  });

  /**
   * Helper to create a mock fetch that returns a JSON response
   * echoing bytesReceived, and control performance.now timing.
   */
  function createFetchMock(timingPairs) {
    let callCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return timingPairs[callCount++] ?? 0;
    });

    return vi.fn().mockImplementation((_url, options) => {
      const body = options?.body;
      const bytesReceived = body ? body.byteLength : 0;
      return Promise.resolve(
        new Response(JSON.stringify({ bytesReceived }), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  }

  it('uploads all three default stages and returns results', async () => {
    const timings = [
      0, 250,      // Stage 1: 250ms
      250, 1250,   // Stage 2: 1000ms
      1250, 3750,  // Stage 3: 2500ms
    ];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureUploadSpeed({ timeout: 60000 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.stages).toHaveLength(3);
    expect(result.speedMbps).toBeGreaterThan(0);
    expect(typeof result.speedMbps).toBe('number');
  });

  it('uses POST method for each upload', async () => {
    const timings = [0, 100];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    await measureUploadSpeed({ stages: [1024], timeout: 60000 });

    const fetchOptions = fetchMock.mock.calls[0][1];
    expect(fetchOptions.method).toBe('POST');
  });

  it('sends a body payload of the correct size', async () => {
    const timings = [0, 100, 100, 200];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    await measureUploadSpeed({ stages: [1024, 4096], timeout: 60000 });

    const body1 = fetchMock.mock.calls[0][1].body;
    const body2 = fetchMock.mock.calls[1][1].body;
    expect(body1).toBeInstanceOf(Uint8Array);
    expect(body1.byteLength).toBe(1024);
    expect(body2.byteLength).toBe(4096);
  });

  it('uses cache-busting query parameter on each fetch', async () => {
    const timings = [0, 100, 100, 200, 200, 300];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    await measureUploadSpeed({ stages: [1024, 2048, 4096], timeout: 60000 });

    for (const [calledUrl] of fetchMock.mock.calls) {
      expect(calledUrl).toMatch(/\?t=\d+$/);
    }
  });

  it('uses no-store cache policy', async () => {
    const timings = [0, 100];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    await measureUploadSpeed({ stages: [1024], timeout: 60000 });

    const fetchOptions = fetchMock.mock.calls[0][1];
    expect(fetchOptions.cache).toBe('no-store');
  });

  it('calls onProgress after each stage', async () => {
    const timings = [0, 100, 100, 200, 200, 300];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const onProgress = vi.fn();
    await measureUploadSpeed({
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
    let perfCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (perfCount++) * 100;
    });

    const fetchMock = vi.fn().mockImplementation(() => {
      callNum++;
      if (callNum === 2) return Promise.reject(new Error('Network error'));
      return Promise.resolve(
        new Response(JSON.stringify({ bytesReceived: 1024 }))
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureUploadSpeed({
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
      measureUploadSpeed({ stages: [1024, 2048], timeout: 60000 })
    ).rejects.toThrow('All upload stages failed');
  });

  it('respects external abort signal (already aborted)', async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureUploadSpeed({
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
      return Promise.resolve(
        new Response(JSON.stringify({ bytesReceived: 1024 }))
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureUploadSpeed({
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

    const fetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ bytesReceived: 1024 }))
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureUploadSpeed();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.stages).toHaveLength(3);
  });

  it('uses custom stages when provided', async () => {
    let perfCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (perfCount++) * 100;
    });

    const fetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ bytesReceived: 512 }))
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureUploadSpeed({
      stages: [512, 1024],
      timeout: 60000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.stages).toHaveLength(2);
  });

  it('each stage result contains bytes, durationMs, and mbps', async () => {
    const timings = [0, 1000];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureUploadSpeed({
      stages: [524_288],
      timeout: 60000,
    });

    const stage = result.stages[0];
    expect(stage).toHaveProperty('bytes');
    expect(stage).toHaveProperty('durationMs');
    expect(stage).toHaveProperty('mbps');
    expect(stage.bytes).toBe(524_288);
    expect(stage.durationMs).toBe(1000);
    // 512 KB * 8 bits / 1 second / 1_000_000 = 4.19 Mbps
    expect(stage.mbps).toBe(4.19);
  });

  it('computes correct weighted speed across stages', async () => {
    // Stage 1: 512KB in 250ms
    // Stage 2: 2MB in 1000ms
    const timings = [0, 250, 250, 1250];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureUploadSpeed({
      stages: [524_288, 2_097_152],
      timeout: 60000,
    });

    const totalBytes = 524_288 + 2_097_152;
    const totalBits = totalBytes * 8;
    const totalSeconds = 1.25;
    const expectedMbps = Math.round((totalBits / totalSeconds / 1_000_000) * 100) / 100;

    expect(result.speedMbps).toBe(expectedMbps);
  });

  it('uploads to the configured URL endpoint', async () => {
    const timings = [0, 100];
    const fetchMock = createFetchMock(timings);
    vi.stubGlobal('fetch', fetchMock);

    await measureUploadSpeed({
      url: '/custom-upload',
      stages: [1024],
      timeout: 60000,
    });

    expect(fetchMock.mock.calls[0][0]).toMatch(/^\/custom-upload\?t=\d+$/);
  });
});
