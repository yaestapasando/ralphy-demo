/**
 * CSV Export Utility
 * Provides functionality to export speed test results to CSV format
 */

/**
 * Connection type display labels
 */
const CONNECTION_LABELS = {
  wifi: 'Wi-Fi',
  cellular: 'Datos móviles',
  ethernet: 'Ethernet',
  bluetooth: 'Bluetooth',
  '4g': '4G',
  '5g': '5G',
  '3g': '3G',
  '2g': '2G',
  'slow-2g': '2G lenta',
  unknown: 'Desconocida',
  none: 'Sin conexión',
};

/**
 * Get connection type label for CSV export
 * @param {string} connectionType - Connection type
 * @param {string} effectiveType - Effective connection type
 * @returns {string} Human-readable label
 */
function getConnectionTypeLabel(connectionType, effectiveType) {
  // If connection type is cellular, use effective type for more specific label
  if (connectionType === 'cellular' && effectiveType) {
    return CONNECTION_LABELS[effectiveType] || CONNECTION_LABELS.cellular;
  }
  return CONNECTION_LABELS[connectionType] || CONNECTION_LABELS.unknown;
}

/**
 * Format a timestamp for CSV export
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} Formatted date and time string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  const dateStr = date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const timeStr = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `${dateStr} ${timeStr}`;
}

/**
 * Format a numeric value or return empty string if null/undefined
 * @param {number|null|undefined} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted value
 */
function formatValue(value, decimals = 2) {
  if (value === null || value === undefined) {
    return '';
  }
  return value.toFixed(decimals);
}

/**
 * Escape a CSV field value
 * Wraps in quotes if contains comma, quote, or newline
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert speed test results to CSV format
 * @param {Array} results - Array of speed test result objects
 * @returns {string} CSV formatted string
 */
export function resultsToCSV(results) {
  if (!Array.isArray(results) || results.length === 0) {
    // Return headers only if no results
    return 'Fecha,Tipo de Conexión,Descarga (Mbps),Subida (Mbps),Ping (ms),Jitter (ms),Downlink (Mbps),RTT (ms),Servidor,IP\n';
  }

  // CSV headers
  const headers = [
    'Fecha',
    'Tipo de Conexión',
    'Descarga (Mbps)',
    'Subida (Mbps)',
    'Ping (ms)',
    'Jitter (ms)',
    'Downlink (Mbps)',
    'RTT (ms)',
    'Servidor',
    'IP'
  ];

  // Build CSV rows
  const rows = results.map(result => {
    const connectionLabel = getConnectionTypeLabel(result.connection_type, result.effective_type);

    return [
      escapeCSVField(formatTimestamp(result.timestamp)),
      escapeCSVField(connectionLabel),
      formatValue(result.download_mbps, 2),
      formatValue(result.upload_mbps, 2),
      formatValue(result.ping_ms, 0),
      formatValue(result.jitter_ms, 2),
      formatValue(result.downlink_mbps, 2),
      formatValue(result.rtt_ms, 0),
      escapeCSVField(result.server_used || 'auto'),
      escapeCSVField(result.ip_address || 'redacted')
    ].join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Filename for download (without extension)
 */
export function downloadCSV(csvContent, filename = 'speed-test-history') {
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Create blob (Blob is a browser API)
  // eslint-disable-next-line no-undef
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  // Add to document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL
  URL.revokeObjectURL(url);
}

/**
 * Export speed test results to CSV file
 * @param {Array} results - Array of speed test result objects
 * @param {string} filename - Optional filename (without extension)
 */
export function exportResultsToCSV(results, filename) {
  const csvContent = resultsToCSV(results);

  // Generate filename with timestamp if not provided
  const defaultFilename = `speed-test-history-${new Date().toISOString().split('T')[0]}`;
  const finalFilename = filename || defaultFilename;

  downloadCSV(csvContent, finalFilename);
}
