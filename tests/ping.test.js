import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computePingStats, measureLatency } from '../src/services/ping.js';

// ---------------------------------------------------------------------------
// computePingStats – pure function tests
// ---------------------------------------------------------------------------

describe('computePingStats', () => {
  it('returns zeroes for empty samples', () => {
    const result = computePingStats([]);
    expect(result).toEqual({ avg: 0, min: 0, max: 0, jitter: 0, samples: [] });
  });

  it('computes correct stats for a single sample', () => {
    const result = computePingStats([10]);
    expect(result.avg).toBe(10);
    expect(result.min).toBe(10);
    expect(result.max).toBe(10);
    expect(result.jitter).toBe(0);
    expect(result.samples).toEqual([10]);
  });

  it('computes correct stats for multiple samples', () => {
    const result = computePingStats([10, 20, 30]);
    expect(result.avg).toBe(20);
    expect(result.min).toBe(10);
    expect(result.max).toBe(30);
    // jitter = stddev = sqrt(((10-20)^2 + (20-20)^2 + (30-20)^2) / 3) = sqrt(200/3) ≈ 8.16
    expect(result.jitter).toBe(8.16);
    expect(result.samples).toEqual([10, 20, 30]);
  });

  it('computes jitter as standard deviation of latency samples', () => {
    // avg = 17.5, deviations: [-7.5, 2.5, -2.5, 7.5]
    // squared: [56.25, 6.25, 6.25, 56.25] → sum = 125 → mean = 31.25
    // stddev = sqrt(31.25) ≈ 5.59
    const result = computePingStats([10, 20, 15, 25]);
    expect(result.jitter).toBe(5.59);
  });

  it('returns zero jitter for identical samples', () => {
    const result = computePingStats([15, 15, 15, 15]);
    expect(result.jitter).toBe(0);
  });

  it('rounds values to 2 decimal places', () => {
    const result = computePingStats([10.123, 20.456, 30.789]);
    expect(result.avg).toBe(20.46);
    expect(result.min).toBe(10.12);
    expect(result.max).toBe(30.79);
    expect(result.samples).toEqual([10.12, 20.46, 30.79]);
  });
});

// ---------------------------------------------------------------------------
// measureLatency – integration tests with mocked fetch
// ---------------------------------------------------------------------------

describe('measureLatency', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock performance.now to return predictable values.
    // Each call pair (start, end) will produce a 15ms RTT.
    let callCount = 0;
    vi.spyOn(globalThis.performance, 'now').mockImplementation(() => {
      return (callCount++) * 15;
    });
  });

  it('sends the configured number of pings and returns stats', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureLatency({ url: '/ping', count: 5, delay: 0, timeout: 1000 });

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(result.samples).toHaveLength(5);
    expect(result.avg).toBeGreaterThan(0);
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThan(0);
    expect(typeof result.jitter).toBe('number');
  });

  it('appends a cache-busting query parameter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    await measureLatency({ url: '/ping', count: 1, delay: 0 });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toMatch(/^\/ping\?t=\d+$/);
  });

  it('handles URL that already has query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    await measureLatency({ url: '/ping?v=1', count: 1, delay: 0 });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toMatch(/^\/ping\?v=1&t=\d+$/);
  });

  it('uses HEAD method and no-store cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    await measureLatency({ url: '/ping', count: 1, delay: 0 });

    const fetchOptions = fetchMock.mock.calls[0][1];
    expect(fetchOptions.method).toBe('HEAD');
    expect(fetchOptions.cache).toBe('no-store');
  });

  it('calls onProgress after each ping', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    const onProgress = vi.fn();
    await measureLatency({ url: '/ping', count: 3, delay: 0, onProgress });

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress.mock.calls[0][0]).toMatchObject({ current: 1, total: 3 });
    expect(onProgress.mock.calls[1][0]).toMatchObject({ current: 2, total: 3 });
    expect(onProgress.mock.calls[2][0]).toMatchObject({ current: 3, total: 3 });
    expect(typeof onProgress.mock.calls[0][0].lastPing).toBe('number');
  });

  it('tolerates individual ping failures', async () => {
    let callNum = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callNum++;
      if (callNum === 2) return Promise.reject(new Error('Network error'));
      return Promise.resolve(new Response());
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await measureLatency({ url: '/ping', count: 3, delay: 0 });

    // 2 successful out of 3
    expect(result.samples).toHaveLength(2);
  });

  it('throws when all pings fail', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureLatency({ url: '/ping', count: 3, delay: 0 })
    ).rejects.toThrow('All ping requests failed');
  });

  it('respects external abort signal', async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureLatency({ url: '/ping', count: 5, delay: 0, signal: controller.signal })
    ).rejects.toSatisfy((err) => err.name === 'AbortError');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts mid-measurement when signal fires', async () => {
    const controller = new AbortController();
    let callNum = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callNum++;
      if (callNum === 2) controller.abort();
      return Promise.resolve(new Response());
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      measureLatency({ url: '/ping', count: 5, delay: 0, signal: controller.signal })
    ).rejects.toSatisfy((err) => err.name === 'AbortError');
  });

  it('uses default options when none provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);

    // This will use defaults: count=10, url='/ping'
    // Use delay: 0 to speed up the test, but keep other defaults
    const result = await measureLatency({ delay: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(result.samples).toHaveLength(10);
  });
});
