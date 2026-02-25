/**
 * Statistics Utilities
 * Functions to calculate statistics for speed test results
 */

/**
 * Calculate statistics for a given metric
 * @param {Array} results - Array of speed test results
 * @param {string} metric - Metric to calculate ('download_mbps', 'upload_mbps', 'ping_ms')
 * @returns {Object} Statistics object with average, max, min
 */
export function calculateStatistics(results, metric) {
  if (!results || results.length === 0) {
    return {
      average: null,
      max: null,
      min: null,
      count: 0
    };
  }

  // Filter out null/undefined values
  const validValues = results
    .map(result => result[metric])
    .filter(value => value !== null && value !== undefined && !isNaN(value));

  if (validValues.length === 0) {
    return {
      average: null,
      max: null,
      min: null,
      count: 0
    };
  }

  const sum = validValues.reduce((acc, value) => acc + value, 0);
  const average = sum / validValues.length;
  const max = Math.max(...validValues);
  const min = Math.min(...validValues);

  return {
    average,
    max,
    min,
    count: validValues.length
  };
}

/**
 * Calculate statistics for all metrics (download, upload, ping)
 * @param {Array} results - Array of speed test results
 * @returns {Object} Statistics for all metrics
 */
export function calculateAllStatistics(results) {
  return {
    download: calculateStatistics(results, 'download_mbps'),
    upload: calculateStatistics(results, 'upload_mbps'),
    ping: calculateStatistics(results, 'ping_ms')
  };
}

/**
 * Format a statistic value with appropriate units
 * @param {number|null} value - Value to format
 * @param {string} metric - Metric type ('download_mbps', 'upload_mbps', 'ping_ms')
 * @returns {string} Formatted value with units
 */
export function formatStatistic(value, metric) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  if (metric === 'ping_ms') {
    return `${value.toFixed(0)} ms`;
  }

  // For download_mbps and upload_mbps
  return `${value.toFixed(2)} Mbps`;
}
