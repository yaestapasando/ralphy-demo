/**
 * Tests for statistics utility functions
 */

import { describe, it, expect } from 'vitest';
import { calculateStatistics, calculateAllStatistics, formatStatistic } from '../src/utils/statistics.js';

describe('Statistics Utils', () => {
  describe('calculateStatistics', () => {
    it('should calculate correct statistics for valid data', () => {
      const results = [
        { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
        { download_mbps: 100, upload_mbps: 20, ping_ms: 10 },
        { download_mbps: 75, upload_mbps: 15, ping_ms: 15 }
      ];

      const downloadStats = calculateStatistics(results, 'download_mbps');
      expect(downloadStats.average).toBe(75);
      expect(downloadStats.max).toBe(100);
      expect(downloadStats.min).toBe(50);
      expect(downloadStats.count).toBe(3);
    });

    it('should handle results with null values', () => {
      const results = [
        { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
        { download_mbps: null, upload_mbps: 20, ping_ms: null },
        { download_mbps: 100, upload_mbps: null, ping_ms: 10 }
      ];

      const downloadStats = calculateStatistics(results, 'download_mbps');
      expect(downloadStats.average).toBe(75);
      expect(downloadStats.max).toBe(100);
      expect(downloadStats.min).toBe(50);
      expect(downloadStats.count).toBe(2);

      const uploadStats = calculateStatistics(results, 'upload_mbps');
      expect(uploadStats.average).toBe(15);
      expect(uploadStats.max).toBe(20);
      expect(uploadStats.min).toBe(10);
      expect(uploadStats.count).toBe(2);
    });

    it('should handle empty array', () => {
      const results = [];
      const stats = calculateStatistics(results, 'download_mbps');

      expect(stats.average).toBeNull();
      expect(stats.max).toBeNull();
      expect(stats.min).toBeNull();
      expect(stats.count).toBe(0);
    });

    it('should handle array with all null values', () => {
      const results = [
        { download_mbps: null, upload_mbps: null, ping_ms: null },
        { download_mbps: null, upload_mbps: null, ping_ms: null }
      ];

      const stats = calculateStatistics(results, 'download_mbps');
      expect(stats.average).toBeNull();
      expect(stats.max).toBeNull();
      expect(stats.min).toBeNull();
      expect(stats.count).toBe(0);
    });

    it('should handle single result', () => {
      const results = [
        { download_mbps: 50, upload_mbps: 10, ping_ms: 20 }
      ];

      const stats = calculateStatistics(results, 'download_mbps');
      expect(stats.average).toBe(50);
      expect(stats.max).toBe(50);
      expect(stats.min).toBe(50);
      expect(stats.count).toBe(1);
    });

    it('should handle undefined values', () => {
      const results = [
        { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
        { download_mbps: undefined, upload_mbps: undefined, ping_ms: undefined },
        { download_mbps: 100, upload_mbps: 20, ping_ms: 10 }
      ];

      const downloadStats = calculateStatistics(results, 'download_mbps');
      expect(downloadStats.average).toBe(75);
      expect(downloadStats.max).toBe(100);
      expect(downloadStats.min).toBe(50);
      expect(downloadStats.count).toBe(2);
    });

    it('should handle NaN values', () => {
      const results = [
        { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
        { download_mbps: NaN, upload_mbps: NaN, ping_ms: NaN },
        { download_mbps: 100, upload_mbps: 20, ping_ms: 10 }
      ];

      const downloadStats = calculateStatistics(results, 'download_mbps');
      expect(downloadStats.average).toBe(75);
      expect(downloadStats.max).toBe(100);
      expect(downloadStats.min).toBe(50);
      expect(downloadStats.count).toBe(2);
    });

    it('should calculate correct average with decimal values', () => {
      const results = [
        { download_mbps: 33.33, upload_mbps: 10, ping_ms: 20 },
        { download_mbps: 66.66, upload_mbps: 20, ping_ms: 10 },
        { download_mbps: 99.99, upload_mbps: 30, ping_ms: 15 }
      ];

      const downloadStats = calculateStatistics(results, 'download_mbps');
      expect(downloadStats.average).toBeCloseTo(66.66, 2);
      expect(downloadStats.max).toBeCloseTo(99.99, 2);
      expect(downloadStats.min).toBeCloseTo(33.33, 2);
      expect(downloadStats.count).toBe(3);
    });
  });

  describe('calculateAllStatistics', () => {
    it('should calculate statistics for all metrics', () => {
      const results = [
        { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
        { download_mbps: 100, upload_mbps: 20, ping_ms: 10 },
        { download_mbps: 75, upload_mbps: 15, ping_ms: 15 }
      ];

      const stats = calculateAllStatistics(results);

      expect(stats.download.average).toBe(75);
      expect(stats.download.max).toBe(100);
      expect(stats.download.min).toBe(50);

      expect(stats.upload.average).toBe(15);
      expect(stats.upload.max).toBe(20);
      expect(stats.upload.min).toBe(10);

      expect(stats.ping.average).toBe(15);
      expect(stats.ping.max).toBe(20);
      expect(stats.ping.min).toBe(10);
    });

    it('should handle empty results', () => {
      const results = [];
      const stats = calculateAllStatistics(results);

      expect(stats.download.average).toBeNull();
      expect(stats.upload.average).toBeNull();
      expect(stats.ping.average).toBeNull();
    });

    it('should handle mixed null values across metrics', () => {
      const results = [
        { download_mbps: 50, upload_mbps: null, ping_ms: 20 },
        { download_mbps: null, upload_mbps: 20, ping_ms: null },
        { download_mbps: 100, upload_mbps: null, ping_ms: 10 }
      ];

      const stats = calculateAllStatistics(results);

      expect(stats.download.average).toBe(75);
      expect(stats.download.count).toBe(2);

      expect(stats.upload.average).toBe(20);
      expect(stats.upload.count).toBe(1);

      expect(stats.ping.average).toBe(15);
      expect(stats.ping.count).toBe(2);
    });
  });

  describe('formatStatistic', () => {
    it('should format download speed correctly', () => {
      expect(formatStatistic(50.123, 'download_mbps')).toBe('50.12 Mbps');
      expect(formatStatistic(100, 'download_mbps')).toBe('100.00 Mbps');
      expect(formatStatistic(0.5, 'download_mbps')).toBe('0.50 Mbps');
    });

    it('should format upload speed correctly', () => {
      expect(formatStatistic(10.567, 'upload_mbps')).toBe('10.57 Mbps');
      expect(formatStatistic(20, 'upload_mbps')).toBe('20.00 Mbps');
      expect(formatStatistic(0.1, 'upload_mbps')).toBe('0.10 Mbps');
    });

    it('should format ping correctly', () => {
      expect(formatStatistic(15.789, 'ping_ms')).toBe('16 ms');
      expect(formatStatistic(10, 'ping_ms')).toBe('10 ms');
      expect(formatStatistic(100.4, 'ping_ms')).toBe('100 ms');
      expect(formatStatistic(100.5, 'ping_ms')).toBe('101 ms');
    });

    it('should handle null values', () => {
      expect(formatStatistic(null, 'download_mbps')).toBe('—');
      expect(formatStatistic(null, 'upload_mbps')).toBe('—');
      expect(formatStatistic(null, 'ping_ms')).toBe('—');
    });

    it('should handle undefined values', () => {
      expect(formatStatistic(undefined, 'download_mbps')).toBe('—');
      expect(formatStatistic(undefined, 'upload_mbps')).toBe('—');
      expect(formatStatistic(undefined, 'ping_ms')).toBe('—');
    });

    it('should handle NaN values', () => {
      expect(formatStatistic(NaN, 'download_mbps')).toBe('—');
      expect(formatStatistic(NaN, 'upload_mbps')).toBe('—');
      expect(formatStatistic(NaN, 'ping_ms')).toBe('—');
    });

    it('should handle zero values', () => {
      expect(formatStatistic(0, 'download_mbps')).toBe('0.00 Mbps');
      expect(formatStatistic(0, 'upload_mbps')).toBe('0.00 Mbps');
      expect(formatStatistic(0, 'ping_ms')).toBe('0 ms');
    });

    it('should handle very large values', () => {
      expect(formatStatistic(1000.567, 'download_mbps')).toBe('1000.57 Mbps');
      expect(formatStatistic(9999.99, 'upload_mbps')).toBe('9999.99 Mbps');
      expect(formatStatistic(5000, 'ping_ms')).toBe('5000 ms');
    });

    it('should handle very small values', () => {
      expect(formatStatistic(0.01, 'download_mbps')).toBe('0.01 Mbps');
      expect(formatStatistic(0.001, 'upload_mbps')).toBe('0.00 Mbps');
      expect(formatStatistic(0.5, 'ping_ms')).toBe('1 ms');
    });
  });
});
