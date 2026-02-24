/**
 * Unit tests for SpeedChart component.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSpeedChart } from '../src/components/speed-chart.js';

// Mock Chart.js since it requires canvas which is not available in happy-dom
vi.mock('chart.js', () => {
  class MockChart {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.data = config.data;
      this.options = config.options;
      this.type = config.type;
      this.destroy = vi.fn();
      this.update = vi.fn();
    }
  }

  MockChart.register = vi.fn();

  return {
    Chart: MockChart,
    LineController: {},
    LineElement: {},
    PointElement: {},
    LinearScale: {},
    TimeScale: {},
    Title: {},
    Tooltip: {},
    Legend: {},
    Filler: {}
  };
});

vi.mock('chartjs-adapter-date-fns', () => ({}));

describe('speed-chart component', () => {
  let container;

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // ===========================================================================
  // Component initialization
  // ===========================================================================

  describe('component initialization', () => {
    it('requires a container element', () => {
      expect(() => createSpeedChart()).toThrow('Container element is required');
      expect(() => createSpeedChart(null)).toThrow('Container element is required');
    });

    it('returns an API object with expected methods', () => {
      const chart = createSpeedChart(container);
      expect(chart).toHaveProperty('update');
      expect(chart).toHaveProperty('destroy');
      expect(chart).toHaveProperty('getChart');
      expect(typeof chart.update).toBe('function');
      expect(typeof chart.destroy).toBe('function');
      expect(typeof chart.getChart).toBe('function');
    });
  });

  // ===========================================================================
  // Empty state
  // ===========================================================================

  describe('empty state', () => {
    it('displays empty state when no results provided', () => {
      const chart = createSpeedChart(container);
      chart.update([]);

      const emptyState = container.querySelector('.speed-chart__empty');
      expect(emptyState).not.toBeNull();
      expect(emptyState.textContent).toContain('No hay datos suficientes');
    });

    it('displays empty state when only one result provided', () => {
      const chart = createSpeedChart(container);
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          connection_type: 'wifi'
        }
      ];
      chart.update(results);

      const emptyState = container.querySelector('.speed-chart__empty');
      expect(emptyState).not.toBeNull();
      expect(emptyState.textContent).toContain('No hay datos suficientes');
    });

    it('does not display canvas when showing empty state', () => {
      const chart = createSpeedChart(container);
      chart.update([]);

      const canvas = container.querySelector('.speed-chart__canvas');
      expect(canvas).toBeNull();
    });
  });

  // ===========================================================================
  // Chart rendering with data
  // ===========================================================================

  describe('chart rendering with data', () => {
    it('displays canvas when sufficient results provided', () => {
      const chart = createSpeedChart(container);
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          connection_type: 'wifi'
        },
        {
          id: 'test-2',
          timestamp: '2026-02-24T11:30:00Z',
          download_mbps: 98.2,
          upload_mbps: 44.5,
          ping_ms: 10,
          connection_type: 'wifi'
        }
      ];
      chart.update(results);

      const canvas = container.querySelector('.speed-chart__canvas');
      expect(canvas).not.toBeNull();
    });

    it('does not display empty state when sufficient results provided', () => {
      const chart = createSpeedChart(container);
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          connection_type: 'wifi'
        },
        {
          id: 'test-2',
          timestamp: '2026-02-24T11:30:00Z',
          download_mbps: 98.2,
          upload_mbps: 44.5,
          ping_ms: 10,
          connection_type: 'wifi'
        }
      ];
      chart.update(results);

      const emptyState = container.querySelector('.speed-chart__empty');
      expect(emptyState).toBeNull();
    });
  });

  // ===========================================================================
  // Chart updates
  // ===========================================================================

  describe('chart updates', () => {
    it('updates chart when new results provided', () => {
      const chart = createSpeedChart(container);

      // Initial update with 2 results
      const initialResults = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          connection_type: 'wifi'
        },
        {
          id: 'test-2',
          timestamp: '2026-02-24T11:30:00Z',
          download_mbps: 98.2,
          upload_mbps: 44.5,
          ping_ms: 10,
          connection_type: 'wifi'
        }
      ];
      chart.update(initialResults);
      expect(container.querySelector('.speed-chart__canvas')).not.toBeNull();

      // Update with new results
      const newResults = [
        ...initialResults,
        {
          id: 'test-3',
          timestamp: '2026-02-24T12:30:00Z',
          download_mbps: 100.1,
          upload_mbps: 45.2,
          ping_ms: 11,
          connection_type: 'wifi'
        }
      ];
      chart.update(newResults);
      expect(container.querySelector('.speed-chart__canvas')).not.toBeNull();
    });

    it('switches to empty state when results drop below 2', () => {
      const chart = createSpeedChart(container);

      // Initial update with 2 results
      const initialResults = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          connection_type: 'wifi'
        },
        {
          id: 'test-2',
          timestamp: '2026-02-24T11:30:00Z',
          download_mbps: 98.2,
          upload_mbps: 44.5,
          ping_ms: 10,
          connection_type: 'wifi'
        }
      ];
      chart.update(initialResults);
      expect(container.querySelector('.speed-chart__canvas')).not.toBeNull();

      // Update with only 1 result
      chart.update([initialResults[0]]);
      expect(container.querySelector('.speed-chart__empty')).not.toBeNull();
      expect(container.querySelector('.speed-chart__canvas')).toBeNull();
    });
  });

  // ===========================================================================
  // Chart destruction
  // ===========================================================================

  describe('chart destruction', () => {
    it('cleans up chart when destroyed', () => {
      const chart = createSpeedChart(container);
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          connection_type: 'wifi'
        },
        {
          id: 'test-2',
          timestamp: '2026-02-24T11:30:00Z',
          download_mbps: 98.2,
          upload_mbps: 44.5,
          ping_ms: 10,
          connection_type: 'wifi'
        }
      ];
      chart.update(results);

      const canvas = container.querySelector('.speed-chart__canvas');
      expect(canvas).not.toBeNull();

      chart.destroy();
      expect(container.querySelector('.speed-chart__canvas')).toBeNull();
    });

    it('can be safely called multiple times', () => {
      const chart = createSpeedChart(container);
      expect(() => {
        chart.destroy();
        chart.destroy();
        chart.destroy();
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // Data sorting
  // ===========================================================================

  describe('data sorting', () => {
    it('handles results in any order', () => {
      const chart = createSpeedChart(container);

      // Results in reverse chronological order
      const results = [
        {
          id: 'test-3',
          timestamp: '2026-02-24T12:30:00Z',
          download_mbps: 100.1,
          upload_mbps: 45.2,
          ping_ms: 11,
          connection_type: 'wifi'
        },
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          connection_type: 'wifi'
        },
        {
          id: 'test-2',
          timestamp: '2026-02-24T11:30:00Z',
          download_mbps: 98.2,
          upload_mbps: 44.5,
          ping_ms: 10,
          connection_type: 'wifi'
        }
      ];

      // Should not throw and should display chart
      expect(() => chart.update(results)).not.toThrow();
      expect(container.querySelector('.speed-chart__canvas')).not.toBeNull();
    });
  });
});
