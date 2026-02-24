import { describe, it, expect } from 'vitest';
import {
  bytesToMbps as downloadBytesToMbps,
  computeWeightedSpeed as downloadWeightedSpeed,
} from '../src/services/download.js';
import {
  bytesToMbps as uploadBytesToMbps,
  computeWeightedSpeed as uploadWeightedSpeed,
} from '../src/services/upload.js';
import { computePingStats } from '../src/services/ping.js';
import { formatValue, buildMetricDisplayData } from '../src/components/results-screen.js';

// ===========================================================================
// bytesToMbps — Download module
// ===========================================================================

describe('download bytesToMbps', () => {
  it('converts 1 MB in 1 second to 8.39 Mbps', () => {
    expect(downloadBytesToMbps(1_048_576, 1000)).toBe(8.39);
  });

  it('converts 10 MB in 1 second to 83.89 Mbps', () => {
    expect(downloadBytesToMbps(10_485_760, 1000)).toBe(83.89);
  });

  it('converts 25 MB in 2 seconds to 104.86 Mbps', () => {
    expect(downloadBytesToMbps(26_214_400, 2000)).toBe(104.86);
  });

  it('returns 0 for zero duration', () => {
    expect(downloadBytesToMbps(1000, 0)).toBe(0);
  });

  it('returns 0 for negative duration', () => {
    expect(downloadBytesToMbps(1000, -1)).toBe(0);
  });

  it('returns 0 for zero bytes', () => {
    expect(downloadBytesToMbps(0, 1000)).toBe(0);
  });

  it('handles very small transfers (1 byte in 1ms)', () => {
    // 1 byte = 8 bits, in 0.001 seconds = 8000 bits/s = 0.008 Mbps
    expect(downloadBytesToMbps(1, 1)).toBe(0.01);
  });

  it('handles gigabit-level speeds', () => {
    // 125 MB in 1 second = 1000 Mbps (1 Gbps)
    expect(downloadBytesToMbps(125_000_000, 1000)).toBe(1000);
  });

  it('rounds to exactly 2 decimal places', () => {
    // 1000 bytes in 3ms → bits=8000, sec=0.003, Mbps=2.666...
    const result = downloadBytesToMbps(1000, 3);
    expect(result).toBe(2.67);
    expect(String(result).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it('handles very long transfer durations', () => {
    // 1 MB in 60 seconds = very slow
    const result = downloadBytesToMbps(1_048_576, 60_000);
    expect(result).toBe(0.14);
  });
});

// ===========================================================================
// bytesToMbps — Upload module
// ===========================================================================

describe('upload bytesToMbps', () => {
  it('converts 512 KB in 1 second to 4.19 Mbps', () => {
    expect(uploadBytesToMbps(524_288, 1000)).toBe(4.19);
  });

  it('converts 2 MB in 1 second to 16.78 Mbps', () => {
    expect(uploadBytesToMbps(2_097_152, 1000)).toBe(16.78);
  });

  it('converts 5 MB in 1 second to 41.94 Mbps', () => {
    expect(uploadBytesToMbps(5_242_880, 1000)).toBe(41.94);
  });

  it('returns 0 for zero duration', () => {
    expect(uploadBytesToMbps(1000, 0)).toBe(0);
  });

  it('returns 0 for negative duration', () => {
    expect(uploadBytesToMbps(1000, -500)).toBe(0);
  });

  it('returns 0 for zero bytes', () => {
    expect(uploadBytesToMbps(0, 1000)).toBe(0);
  });
});

// ===========================================================================
// Cross-module consistency — both bytesToMbps implementations must agree
// ===========================================================================

describe('bytesToMbps cross-module consistency', () => {
  const testCases = [
    [0, 1000],
    [1, 1],
    [1024, 100],
    [1_048_576, 1000],
    [10_485_760, 2000],
    [26_214_400, 5000],
    [125_000_000, 1000],
    [1000, 0],
    [1000, -1],
  ];

  for (const [bytes, ms] of testCases) {
    it(`download and upload agree for ${bytes} bytes / ${ms} ms`, () => {
      expect(downloadBytesToMbps(bytes, ms)).toBe(uploadBytesToMbps(bytes, ms));
    });
  }
});

// ===========================================================================
// computeWeightedSpeed — Download module
// ===========================================================================

describe('download computeWeightedSpeed', () => {
  it('returns 0 for empty stages', () => {
    expect(downloadWeightedSpeed([])).toBe(0);
  });

  it('returns the speed of a single stage', () => {
    const stages = [{ bytes: 1_048_576, durationMs: 1000, mbps: 8.39 }];
    expect(downloadWeightedSpeed(stages)).toBe(8.39);
  });

  it('weights by total bytes / total time (not arithmetic mean of per-stage Mbps)', () => {
    // Stage 1: 1 MB in 500ms = ~16.78 Mbps (small, fast)
    // Stage 2: 10 MB in 5000ms = ~16.78 Mbps (large, slow)
    // Arithmetic mean of Mbps: (16.78 + 16.78) / 2 = 16.78
    // Weighted: same rate → also 16.78; to show weighting, use different rates:
    // Stage 1: 1 MB in 2000ms = ~4.19 Mbps
    // Stage 2: 10 MB in 1000ms = ~83.89 Mbps
    // Arithmetic mean: (4.19 + 83.89) / 2 = 44.04
    // Weighted: 11 MB in 3000ms
    const stages = [
      { bytes: 1_048_576, durationMs: 2000, mbps: 4.19 },
      { bytes: 10_485_760, durationMs: 1000, mbps: 83.89 },
    ];
    const result = downloadWeightedSpeed(stages);
    const arithmeticMean = Math.round(((4.19 + 83.89) / 2) * 100) / 100;

    // Weighted result is NOT the arithmetic mean
    expect(result).not.toBe(arithmeticMean);

    // Verify correct weighted calculation
    const totalBytes = 1_048_576 + 10_485_760;
    const totalMs = 3000;
    const expected = Math.round((totalBytes * 8 / (totalMs / 1000) / 1_000_000) * 100) / 100;
    expect(result).toBe(expected);
  });

  it('handles three progressive stages (like default config)', () => {
    const stages = [
      { bytes: 1_048_576, durationMs: 500, mbps: 16.78 },
      { bytes: 10_485_760, durationMs: 2000, mbps: 41.94 },
      { bytes: 26_214_400, durationMs: 4000, mbps: 52.43 },
    ];
    const totalBytes = 1_048_576 + 10_485_760 + 26_214_400;
    const totalMs = 500 + 2000 + 4000;
    const expected = Math.round((totalBytes * 8 / (totalMs / 1000) / 1_000_000) * 100) / 100;
    expect(downloadWeightedSpeed(stages)).toBe(expected);
  });

  it('naturally gives more weight to larger downloads', () => {
    // A slow small download + fast large download → result closer to fast
    const slow = { bytes: 1024, durationMs: 1000, mbps: 0.01 };
    const fast = { bytes: 10_000_000, durationMs: 500, mbps: 160 };
    const result = downloadWeightedSpeed([slow, fast]);
    // Should be much closer to 160 than to 0.01
    expect(result).toBeGreaterThan(50);
  });
});

// ===========================================================================
// computeWeightedSpeed — Upload module
// ===========================================================================

describe('upload computeWeightedSpeed', () => {
  it('returns 0 for empty stages', () => {
    expect(uploadWeightedSpeed([])).toBe(0);
  });

  it('returns the speed of a single stage', () => {
    const stages = [{ bytes: 524_288, durationMs: 1000, mbps: 4.19 }];
    expect(uploadWeightedSpeed(stages)).toBe(4.19);
  });

  it('computes weighted average for upload stages', () => {
    const stages = [
      { bytes: 524_288, durationMs: 250, mbps: 16.78 },
      { bytes: 2_097_152, durationMs: 1000, mbps: 16.78 },
      { bytes: 5_242_880, durationMs: 2500, mbps: 16.78 },
    ];
    const totalBytes = 524_288 + 2_097_152 + 5_242_880;
    const totalMs = 250 + 1000 + 2500;
    const expected = Math.round((totalBytes * 8 / (totalMs / 1000) / 1_000_000) * 100) / 100;
    expect(uploadWeightedSpeed(stages)).toBe(expected);
  });
});

// ===========================================================================
// computeWeightedSpeed — Cross-module consistency
// ===========================================================================

describe('computeWeightedSpeed cross-module consistency', () => {
  it('both modules produce the same result for identical inputs', () => {
    const stages = [
      { bytes: 1_048_576, durationMs: 500, mbps: 16.78 },
      { bytes: 10_485_760, durationMs: 2000, mbps: 41.94 },
    ];
    expect(downloadWeightedSpeed(stages)).toBe(uploadWeightedSpeed(stages));
  });
});

// ===========================================================================
// computePingStats — Latency statistics
// ===========================================================================

describe('computePingStats', () => {
  it('returns zeroes for empty samples', () => {
    expect(computePingStats([])).toEqual({
      avg: 0, min: 0, max: 0, jitter: 0, samples: [],
    });
  });

  it('returns correct stats for a single sample', () => {
    const result = computePingStats([25]);
    expect(result.avg).toBe(25);
    expect(result.min).toBe(25);
    expect(result.max).toBe(25);
    expect(result.jitter).toBe(0);
  });

  it('computes average correctly', () => {
    expect(computePingStats([10, 20, 30]).avg).toBe(20);
    expect(computePingStats([5, 15]).avg).toBe(10);
    expect(computePingStats([100]).avg).toBe(100);
  });

  it('finds min and max correctly', () => {
    const result = computePingStats([50, 10, 90, 30, 70]);
    expect(result.min).toBe(10);
    expect(result.max).toBe(90);
  });

  it('computes jitter as population standard deviation', () => {
    // samples: [10, 20, 30], avg=20
    // deviations: [-10, 0, 10], squared: [100, 0, 100]
    // variance = 200/3, stddev = sqrt(200/3) ≈ 8.16
    expect(computePingStats([10, 20, 30]).jitter).toBe(8.16);
  });

  it('returns zero jitter for identical samples', () => {
    expect(computePingStats([42, 42, 42, 42]).jitter).toBe(0);
  });

  it('returns zero jitter for a single sample', () => {
    expect(computePingStats([15]).jitter).toBe(0);
  });

  it('computes jitter for two samples', () => {
    // samples: [10, 20], avg=15
    // deviations: [-5, 5], squared: [25, 25]
    // variance = 50/2 = 25, stddev = 5
    expect(computePingStats([10, 20]).jitter).toBe(5);
  });

  it('computes jitter for four varied samples', () => {
    // samples: [10, 20, 15, 25], avg=17.5
    // deviations: [-7.5, 2.5, -2.5, 7.5]
    // squared: [56.25, 6.25, 6.25, 56.25] → sum=125, mean=31.25
    // stddev = sqrt(31.25) ≈ 5.59
    expect(computePingStats([10, 20, 15, 25]).jitter).toBe(5.59);
  });

  it('rounds all values to 2 decimal places', () => {
    const result = computePingStats([10.123, 20.456, 30.789]);
    expect(result.avg).toBe(20.46);
    expect(result.min).toBe(10.12);
    expect(result.max).toBe(30.79);
    expect(result.samples).toEqual([10.12, 20.46, 30.79]);
  });

  it('handles very small latency values', () => {
    const result = computePingStats([0.1, 0.2, 0.3]);
    expect(result.avg).toBe(0.2);
    expect(result.min).toBe(0.1);
    expect(result.max).toBe(0.3);
  });

  it('handles large latency values', () => {
    const result = computePingStats([500, 1000, 1500]);
    expect(result.avg).toBe(1000);
    expect(result.min).toBe(500);
    expect(result.max).toBe(1500);
  });

  it('preserves sample count in returned samples array', () => {
    const input = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const result = computePingStats(input);
    expect(result.samples).toHaveLength(10);
  });

  it('rounds each individual sample in the returned array', () => {
    const result = computePingStats([1.111, 2.222, 3.333]);
    expect(result.samples).toEqual([1.11, 2.22, 3.33]);
  });
});

// ===========================================================================
// formatValue — Display formatting
// ===========================================================================

describe('formatValue', () => {
  it('returns "0" for zero', () => {
    expect(formatValue(0)).toBe('0');
  });

  it('shows one decimal place for values less than 10', () => {
    expect(formatValue(5.67)).toBe('5.7');
    expect(formatValue(0.5)).toBe('0.5');
    expect(formatValue(1)).toBe('1.0');
    expect(formatValue(9.9)).toBe('9.9');
  });

  it('rounds to integer for values 10 and above', () => {
    expect(formatValue(10)).toBe('10');
    expect(formatValue(10.4)).toBe('10');
    expect(formatValue(10.5)).toBe('11');
    expect(formatValue(99.9)).toBe('100');
    expect(formatValue(1000)).toBe('1000');
  });

  it('handles the boundary at exactly 10', () => {
    // 10 is >= 10, so it should be an integer
    expect(formatValue(10)).toBe('10');
    // 9.99 < 10, shows one decimal
    expect(formatValue(9.99)).toBe('10.0');
  });

  it('handles very small positive values', () => {
    expect(formatValue(0.01)).toBe('0.0');
    expect(formatValue(0.05)).toBe('0.1');
    expect(formatValue(0.15)).toBe('0.1');
  });
});

// ===========================================================================
// buildMetricDisplayData — Result object transformation
// ===========================================================================

describe('buildMetricDisplayData', () => {
  it('returns exactly four metrics', () => {
    const data = buildMetricDisplayData({ download: 0, upload: 0, ping: 0, jitter: 0 });
    expect(data).toHaveLength(4);
  });

  it('returns metrics in order: download, upload, ping, jitter', () => {
    const data = buildMetricDisplayData({ download: 1, upload: 2, ping: 3, jitter: 4 });
    expect(data.map((d) => d.icon)).toEqual(['download', 'upload', 'ping', 'jitter']);
  });

  it('formats values using formatValue rules', () => {
    const data = buildMetricDisplayData({
      download: 95.4,
      upload: 5.67,
      ping: 12.5,
      jitter: 1.8,
    });
    expect(data[0].value).toBe('95');      // >= 10: integer
    expect(data[1].value).toBe('5.7');     // < 10: one decimal
    expect(data[2].value).toBe('13');      // >= 10: integer
    expect(data[3].value).toBe('1.8');     // < 10: one decimal
  });

  it('assigns correct units (Mbps for speeds, ms for latency)', () => {
    const data = buildMetricDisplayData({ download: 50, upload: 25, ping: 10, jitter: 2 });
    expect(data[0].unit).toBe('Mbps');
    expect(data[1].unit).toBe('Mbps');
    expect(data[2].unit).toBe('ms');
    expect(data[3].unit).toBe('ms');
  });

  it('assigns correct labels in Spanish', () => {
    const data = buildMetricDisplayData({ download: 0, upload: 0, ping: 0, jitter: 0 });
    expect(data[0].label).toBe('Descarga');
    expect(data[1].label).toBe('Subida');
    expect(data[2].label).toBe('Ping');
    expect(data[3].label).toBe('Jitter');
  });

  it('handles missing properties gracefully (defaults to 0)', () => {
    const data = buildMetricDisplayData({});
    for (const item of data) {
      expect(item.value).toBe('0');
    }
  });

  it('handles gigabit-level speeds', () => {
    const data = buildMetricDisplayData({
      download: 940,
      upload: 880,
      ping: 1.2,
      jitter: 0.3,
    });
    expect(data[0].value).toBe('940');
    expect(data[1].value).toBe('880');
    expect(data[2].value).toBe('1.2');
    expect(data[3].value).toBe('0.3');
  });

  it('handles very slow connection speeds', () => {
    const data = buildMetricDisplayData({
      download: 0.5,
      upload: 0.1,
      ping: 500,
      jitter: 150,
    });
    expect(data[0].value).toBe('0.5');
    expect(data[1].value).toBe('0.1');
    expect(data[2].value).toBe('500');
    expect(data[3].value).toBe('150');
  });

  it('each item has label, value, unit, and icon', () => {
    const data = buildMetricDisplayData({ download: 50, upload: 25, ping: 10, jitter: 2 });
    for (const item of data) {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('unit');
      expect(item).toHaveProperty('icon');
      expect(typeof item.value).toBe('string');
    }
  });
});

// ===========================================================================
// Speed formula mathematical verification
// ===========================================================================

describe('speed formula verification', () => {
  it('formula: Mbps = (bytes × 8) / (ms / 1000) / 1,000,000', () => {
    // Verify the formula manually for known values
    const bytes = 10_000_000; // 10 MB
    const ms = 1000;          // 1 second
    const expected = (bytes * 8) / (ms / 1000) / 1_000_000; // 80 Mbps
    expect(downloadBytesToMbps(bytes, ms)).toBe(80);
    expect(expected).toBe(80);
  });

  it('100 Mbps connection downloads 12.5 MB/s', () => {
    // At 100 Mbps: 100 * 1_000_000 / 8 = 12_500_000 bytes per second
    const bytesPerSecond = 12_500_000;
    const result = downloadBytesToMbps(bytesPerSecond, 1000);
    expect(result).toBe(100);
  });

  it('weighted speed equals simple speed when all stages have same throughput', () => {
    // If all stages transfer at the same rate, weighted = individual
    const stages = [
      { bytes: 1_000_000, durationMs: 100, mbps: 80 },
      { bytes: 5_000_000, durationMs: 500, mbps: 80 },
      { bytes: 10_000_000, durationMs: 1000, mbps: 80 },
    ];
    const result = downloadWeightedSpeed(stages);
    expect(result).toBe(80);
  });

  it('jitter of 0 means perfectly consistent latency', () => {
    const result = computePingStats([20, 20, 20, 20, 20]);
    expect(result.jitter).toBe(0);
    expect(result.avg).toBe(20);
    expect(result.min).toBe(20);
    expect(result.max).toBe(20);
  });

  it('higher jitter indicates more variable latency', () => {
    const stable = computePingStats([20, 20, 21, 19, 20]);
    const unstable = computePingStats([5, 50, 10, 45, 15]);
    expect(unstable.jitter).toBeGreaterThan(stable.jitter);
  });
});
