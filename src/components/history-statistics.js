/**
 * History Statistics Component
 * Displays summary statistics for speed test results
 * Shows: average, maximum, and minimum for download/upload/ping
 */

import { calculateAllStatistics, formatStatistic } from '../utils/statistics.js';

/**
 * Create a statistic card element
 * @param {string} label - Statistic label (e.g., "Media", "Máximo", "Mínimo")
 * @param {Object} values - Values for download, upload, and ping
 * @returns {HTMLDivElement} Statistic card element
 */
function createStatisticCard(label, values) {
  const card = document.createElement('div');
  card.className = 'history-statistics__card';

  const labelElement = document.createElement('h3');
  labelElement.className = 'history-statistics__label';
  labelElement.textContent = label;

  const metricsContainer = document.createElement('div');
  metricsContainer.className = 'history-statistics__metrics';

  // Download metric
  const downloadMetric = document.createElement('div');
  downloadMetric.className = 'history-statistics__metric';
  downloadMetric.innerHTML = `
    <span class="history-statistics__metric-label">Descarga</span>
    <span class="history-statistics__metric-value history-statistics__metric-value--download">${values.download}</span>
  `;

  // Upload metric
  const uploadMetric = document.createElement('div');
  uploadMetric.className = 'history-statistics__metric';
  uploadMetric.innerHTML = `
    <span class="history-statistics__metric-label">Subida</span>
    <span class="history-statistics__metric-value history-statistics__metric-value--upload">${values.upload}</span>
  `;

  // Ping metric
  const pingMetric = document.createElement('div');
  pingMetric.className = 'history-statistics__metric';
  pingMetric.innerHTML = `
    <span class="history-statistics__metric-label">Ping</span>
    <span class="history-statistics__metric-value history-statistics__metric-value--ping">${values.ping}</span>
  `;

  metricsContainer.appendChild(downloadMetric);
  metricsContainer.appendChild(uploadMetric);
  metricsContainer.appendChild(pingMetric);

  card.appendChild(labelElement);
  card.appendChild(metricsContainer);

  return card;
}

/**
 * Create an empty statistics state
 * @returns {HTMLDivElement} Empty state element
 */
function createEmptyStatistics() {
  const emptyState = document.createElement('div');
  emptyState.className = 'history-statistics__empty';
  emptyState.innerHTML = `
    <p class="history-statistics__empty-text">No hay datos para mostrar estadísticas</p>
  `;
  return emptyState;
}

/**
 * Create and render history statistics
 * @param {HTMLElement} container - Container element
 * @returns {Object} History statistics API
 */
export function createHistoryStatistics(container) {
  if (!container) {
    throw new Error('Container element is required');
  }

  let currentResults = [];

  /**
   * Render statistics based on current results
   */
  function render() {
    // Clear container
    container.innerHTML = '';

    // Check if we have results
    if (!currentResults || currentResults.length === 0) {
      const emptyState = createEmptyStatistics();
      container.appendChild(emptyState);
      return;
    }

    // Calculate statistics
    const stats = calculateAllStatistics(currentResults);

    // Check if we have valid data
    if (stats.download.count === 0 && stats.upload.count === 0 && stats.ping.count === 0) {
      const emptyState = createEmptyStatistics();
      container.appendChild(emptyState);
      return;
    }

    // Create statistics container
    const statisticsContainer = document.createElement('div');
    statisticsContainer.className = 'history-statistics';

    // Create title
    const title = document.createElement('h3');
    title.className = 'history-statistics__title';
    title.textContent = 'Estadísticas Resumidas';

    // Create cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'history-statistics__cards';

    // Average card
    const averageCard = createStatisticCard('Media', {
      download: formatStatistic(stats.download.average, 'download_mbps'),
      upload: formatStatistic(stats.upload.average, 'upload_mbps'),
      ping: formatStatistic(stats.ping.average, 'ping_ms')
    });

    // Maximum card
    const maxCard = createStatisticCard('Máximo', {
      download: formatStatistic(stats.download.max, 'download_mbps'),
      upload: formatStatistic(stats.upload.max, 'upload_mbps'),
      ping: formatStatistic(stats.ping.max, 'ping_ms')
    });

    // Minimum card
    const minCard = createStatisticCard('Mínimo', {
      download: formatStatistic(stats.download.min, 'download_mbps'),
      upload: formatStatistic(stats.upload.min, 'upload_mbps'),
      ping: formatStatistic(stats.ping.min, 'ping_ms')
    });

    cardsContainer.appendChild(averageCard);
    cardsContainer.appendChild(maxCard);
    cardsContainer.appendChild(minCard);

    statisticsContainer.appendChild(title);
    statisticsContainer.appendChild(cardsContainer);

    container.appendChild(statisticsContainer);
  }

  /**
   * Update statistics with new results
   * @param {Array} results - Array of speed test results
   */
  function update(results) {
    currentResults = results || [];
    render();
  }

  /**
   * Clear statistics
   */
  function clear() {
    currentResults = [];
    render();
  }

  // Initial render
  render();

  // Public API
  return {
    update,
    clear,
    render
  };
}
