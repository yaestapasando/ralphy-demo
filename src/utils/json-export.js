/**
 * JSON Export Utility
 * Provides functionality to export speed test results to JSON format
 */

/**
 * Convert speed test results to JSON format
 * @param {Array} results - Array of speed test result objects
 * @returns {string} JSON formatted string
 */
export function resultsToJSON(results) {
  if (!Array.isArray(results)) {
    return JSON.stringify([]);
  }

  // Return pretty-printed JSON with 2-space indentation
  return JSON.stringify(results, null, 2);
}

/**
 * Download JSON file
 * @param {string} jsonContent - JSON formatted string
 * @param {string} filename - Filename for download (without extension)
 */
export function downloadJSON(jsonContent, filename = 'speed-test-history') {
  // Create blob (Blob is a browser API)
  // eslint-disable-next-line no-undef
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';

  // Add to document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL
  URL.revokeObjectURL(url);
}

/**
 * Export speed test results to JSON file
 * @param {Array} results - Array of speed test result objects
 * @param {string} filename - Optional filename (without extension)
 */
export function exportResultsToJSON(results, filename) {
  const jsonContent = resultsToJSON(results);

  // Generate filename with timestamp if not provided
  const defaultFilename = `speed-test-history-${new Date().toISOString().split('T')[0]}`;
  const finalFilename = filename || defaultFilename;

  downloadJSON(jsonContent, finalFilename);
}
