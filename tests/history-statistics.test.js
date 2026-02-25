/**
 * Tests for history statistics component
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHistoryStatistics } from '../src/components/history-statistics.js';

describe('History Statistics Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should throw error if container is not provided', () => {
    expect(() => createHistoryStatistics(null)).toThrow('Container element is required');
  });

  it('should show empty state when no results', () => {
    createHistoryStatistics(container);
    expect(container.querySelector('.history-statistics__empty')).toBeTruthy();
    expect(container.querySelector('.history-statistics__empty-text')).toBeTruthy();
  });

  it('should show statistics when results are provided', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
      { download_mbps: 100, upload_mbps: 20, ping_ms: 10 },
      { download_mbps: 75, upload_mbps: 15, ping_ms: 15 }
    ];

    historyStatistics.update(results);

    expect(container.querySelector('.history-statistics')).toBeTruthy();
    expect(container.querySelector('.history-statistics__title')).toBeTruthy();
    expect(container.querySelector('.history-statistics__title').textContent).toBe('Estadísticas Resumidas');
  });

  it('should display three statistic cards (Media, Máximo, Mínimo)', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
      { download_mbps: 100, upload_mbps: 20, ping_ms: 10 }
    ];

    historyStatistics.update(results);

    const cards = container.querySelectorAll('.history-statistics__card');
    expect(cards.length).toBe(3);

    const labels = Array.from(container.querySelectorAll('.history-statistics__label')).map(el => el.textContent);
    expect(labels).toEqual(['Media', 'Máximo', 'Mínimo']);
  });

  it('should display correct metrics for each card', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 }
    ];

    historyStatistics.update(results);

    const metricLabels = Array.from(container.querySelectorAll('.history-statistics__metric-label')).map(el => el.textContent);

    // Each card should have 3 metrics, so we should have 9 metric labels total
    expect(metricLabels.filter(label => label === 'Descarga').length).toBe(3);
    expect(metricLabels.filter(label => label === 'Subida').length).toBe(3);
    expect(metricLabels.filter(label => label === 'Ping').length).toBe(3);
  });

  it('should calculate and display correct average statistics', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
      { download_mbps: 100, upload_mbps: 20, ping_ms: 10 },
      { download_mbps: 75, upload_mbps: 15, ping_ms: 15 }
    ];

    historyStatistics.update(results);

    const cards = container.querySelectorAll('.history-statistics__card');
    const averageCard = cards[0];

    expect(averageCard.querySelector('.history-statistics__label').textContent).toBe('Media');

    const metrics = averageCard.querySelectorAll('.history-statistics__metric-value');
    expect(metrics[0].textContent).toBe('75.00 Mbps'); // Download average
    expect(metrics[1].textContent).toBe('15.00 Mbps'); // Upload average
    expect(metrics[2].textContent).toBe('15 ms'); // Ping average
  });

  it('should calculate and display correct maximum statistics', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
      { download_mbps: 100, upload_mbps: 20, ping_ms: 10 },
      { download_mbps: 75, upload_mbps: 15, ping_ms: 15 }
    ];

    historyStatistics.update(results);

    const cards = container.querySelectorAll('.history-statistics__card');
    const maxCard = cards[1];

    expect(maxCard.querySelector('.history-statistics__label').textContent).toBe('Máximo');

    const metrics = maxCard.querySelectorAll('.history-statistics__metric-value');
    expect(metrics[0].textContent).toBe('100.00 Mbps'); // Download max
    expect(metrics[1].textContent).toBe('20.00 Mbps'); // Upload max
    expect(metrics[2].textContent).toBe('20 ms'); // Ping max
  });

  it('should calculate and display correct minimum statistics', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 },
      { download_mbps: 100, upload_mbps: 20, ping_ms: 10 },
      { download_mbps: 75, upload_mbps: 15, ping_ms: 15 }
    ];

    historyStatistics.update(results);

    const cards = container.querySelectorAll('.history-statistics__card');
    const minCard = cards[2];

    expect(minCard.querySelector('.history-statistics__label').textContent).toBe('Mínimo');

    const metrics = minCard.querySelectorAll('.history-statistics__metric-value');
    expect(metrics[0].textContent).toBe('50.00 Mbps'); // Download min
    expect(metrics[1].textContent).toBe('10.00 Mbps'); // Upload min
    expect(metrics[2].textContent).toBe('10 ms'); // Ping min
  });

  it('should handle results with null values', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: null, ping_ms: 20 },
      { download_mbps: null, upload_mbps: 20, ping_ms: null },
      { download_mbps: 100, upload_mbps: null, ping_ms: 10 }
    ];

    historyStatistics.update(results);

    expect(container.querySelector('.history-statistics')).toBeTruthy();

    const cards = container.querySelectorAll('.history-statistics__card');
    const averageCard = cards[0];
    const metrics = averageCard.querySelectorAll('.history-statistics__metric-value');

    expect(metrics[0].textContent).toBe('75.00 Mbps'); // Download average (only 2 values)
    expect(metrics[1].textContent).toBe('20.00 Mbps'); // Upload average (only 1 value)
    expect(metrics[2].textContent).toBe('15 ms'); // Ping average (only 2 values)
  });

  it('should show empty state when all values are null', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: null, upload_mbps: null, ping_ms: null },
      { download_mbps: null, upload_mbps: null, ping_ms: null }
    ];

    historyStatistics.update(results);

    expect(container.querySelector('.history-statistics__empty')).toBeTruthy();
  });

  it('should clear statistics when clear() is called', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 }
    ];

    historyStatistics.update(results);
    expect(container.querySelector('.history-statistics')).toBeTruthy();

    historyStatistics.clear();
    expect(container.querySelector('.history-statistics__empty')).toBeTruthy();
  });

  it('should update statistics when update() is called with new results', () => {
    const historyStatistics = createHistoryStatistics(container);

    // First update
    const results1 = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 }
    ];
    historyStatistics.update(results1);

    let cards = container.querySelectorAll('.history-statistics__card');
    let averageCard = cards[0];
    let metrics = averageCard.querySelectorAll('.history-statistics__metric-value');
    expect(metrics[0].textContent).toBe('50.00 Mbps');

    // Second update with different results
    const results2 = [
      { download_mbps: 100, upload_mbps: 20, ping_ms: 10 }
    ];
    historyStatistics.update(results2);

    cards = container.querySelectorAll('.history-statistics__card');
    averageCard = cards[0];
    metrics = averageCard.querySelectorAll('.history-statistics__metric-value');
    expect(metrics[0].textContent).toBe('100.00 Mbps');
  });

  it('should apply correct CSS classes for metric values', () => {
    const historyStatistics = createHistoryStatistics(container);
    const results = [
      { download_mbps: 50, upload_mbps: 10, ping_ms: 20 }
    ];

    historyStatistics.update(results);

    const downloadValues = container.querySelectorAll('.history-statistics__metric-value--download');
    const uploadValues = container.querySelectorAll('.history-statistics__metric-value--upload');
    const pingValues = container.querySelectorAll('.history-statistics__metric-value--ping');

    expect(downloadValues.length).toBe(3); // One in each card
    expect(uploadValues.length).toBe(3);
    expect(pingValues.length).toBe(3);
  });

  it('should handle empty array update', () => {
    const historyStatistics = createHistoryStatistics(container);

    historyStatistics.update([]);

    expect(container.querySelector('.history-statistics__empty')).toBeTruthy();
  });

  it('should have accessible public API', () => {
    const historyStatistics = createHistoryStatistics(container);

    expect(typeof historyStatistics.update).toBe('function');
    expect(typeof historyStatistics.clear).toBe('function');
    expect(typeof historyStatistics.render).toBe('function');
  });
});
