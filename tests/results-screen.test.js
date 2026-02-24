import { describe, it, expect } from 'vitest';
import {
  METRICS,
  formatValue,
  buildMetricDisplayData,
} from '../src/components/results-screen.js';

// ---------------------------------------------------------------------------
// METRICS – configuration sanity
// ---------------------------------------------------------------------------

describe('METRICS', () => {
  it('defines exactly four metrics', () => {
    expect(METRICS).toHaveLength(4);
  });

  it('includes download, upload, ping, and jitter in that order', () => {
    const keys = METRICS.map((m) => m.key);
    expect(keys).toEqual(['download', 'upload', 'ping', 'jitter']);
  });

  it('uses Mbps for download and upload', () => {
    const mbpsMetrics = METRICS.filter((m) => m.unit === 'Mbps');
    expect(mbpsMetrics.map((m) => m.key)).toEqual(['download', 'upload']);
  });

  it('uses ms for ping and jitter', () => {
    const msMetrics = METRICS.filter((m) => m.unit === 'ms');
    expect(msMetrics.map((m) => m.key)).toEqual(['ping', 'jitter']);
  });

  it('each metric has label, unit, key, and icon properties', () => {
    for (const metric of METRICS) {
      expect(metric).toHaveProperty('key');
      expect(metric).toHaveProperty('label');
      expect(metric).toHaveProperty('unit');
      expect(metric).toHaveProperty('icon');
    }
  });
});

// ---------------------------------------------------------------------------
// formatValue – number formatting
// ---------------------------------------------------------------------------

describe('formatValue', () => {
  it('returns "0" for zero', () => {
    expect(formatValue(0)).toBe('0');
  });

  it('shows one decimal for values less than 10', () => {
    expect(formatValue(5.67)).toBe('5.7');
    expect(formatValue(0.5)).toBe('0.5');
    expect(formatValue(9.99)).toBe('10.0');
  });

  it('rounds to integer for values 10 and above', () => {
    expect(formatValue(10)).toBe('10');
    expect(formatValue(95.4)).toBe('95');
    expect(formatValue(123.7)).toBe('124');
  });

  it('handles very small values', () => {
    expect(formatValue(0.01)).toBe('0.0');
    expect(formatValue(0.15)).toBe('0.1');
  });

  it('handles very large values', () => {
    expect(formatValue(1000)).toBe('1000');
    expect(formatValue(999.9)).toBe('1000');
  });
});

// ---------------------------------------------------------------------------
// buildMetricDisplayData – result transformation
// ---------------------------------------------------------------------------

describe('buildMetricDisplayData', () => {
  const sampleResult = {
    download: 95.4,
    upload: 42.1,
    ping: 12.5,
    jitter: 1.8,
  };

  it('returns an array of four items', () => {
    const data = buildMetricDisplayData(sampleResult);
    expect(data).toHaveLength(4);
  });

  it('preserves metric order: download, upload, ping, jitter', () => {
    const data = buildMetricDisplayData(sampleResult);
    expect(data.map((d) => d.icon)).toEqual(['download', 'upload', 'ping', 'jitter']);
  });

  it('formats download speed correctly', () => {
    const data = buildMetricDisplayData(sampleResult);
    const download = data[0];
    expect(download.label).toBe('Descarga');
    expect(download.value).toBe('95');
    expect(download.unit).toBe('Mbps');
  });

  it('formats upload speed correctly', () => {
    const data = buildMetricDisplayData(sampleResult);
    const upload = data[1];
    expect(upload.label).toBe('Subida');
    expect(upload.value).toBe('42');
    expect(upload.unit).toBe('Mbps');
  });

  it('formats ping correctly', () => {
    const data = buildMetricDisplayData(sampleResult);
    const ping = data[2];
    expect(ping.label).toBe('Ping');
    expect(ping.value).toBe('13');
    expect(ping.unit).toBe('ms');
  });

  it('formats jitter correctly (value < 10 shows decimal)', () => {
    const data = buildMetricDisplayData(sampleResult);
    const jitter = data[3];
    expect(jitter.label).toBe('Jitter');
    expect(jitter.value).toBe('1.8');
    expect(jitter.unit).toBe('ms');
  });

  it('handles all-zero results', () => {
    const data = buildMetricDisplayData({ download: 0, upload: 0, ping: 0, jitter: 0 });
    for (const item of data) {
      expect(item.value).toBe('0');
    }
  });

  it('handles missing properties gracefully', () => {
    const data = buildMetricDisplayData({});
    for (const item of data) {
      expect(item.value).toBe('0');
    }
  });

  it('handles very high speeds', () => {
    const data = buildMetricDisplayData({
      download: 940.2,
      upload: 880.5,
      ping: 2.1,
      jitter: 0.3,
    });
    expect(data[0].value).toBe('940');
    expect(data[1].value).toBe('881');
    expect(data[2].value).toBe('2.1');
    expect(data[3].value).toBe('0.3');
  });

  it('each item has label, value, unit, and icon', () => {
    const data = buildMetricDisplayData(sampleResult);
    for (const item of data) {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('unit');
      expect(item).toHaveProperty('icon');
      expect(typeof item.value).toBe('string');
    }
  });
});
