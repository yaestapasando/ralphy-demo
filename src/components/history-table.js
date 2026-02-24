/**
 * History Table Component
 * Displays speed test results in a responsive table format
 * Shows: date, connection type, download speed, upload speed, and ping
 */

import { getAllResults } from '../services/database.js';

/**
 * Connection type display configuration
 * Maps connection types to human-readable labels
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
 * Connection type icons (emojis)
 */
const CONNECTION_ICONS = {
  wifi: '📶',
  cellular: '📱',
  ethernet: '🔌',
  bluetooth: '🔷',
  '4g': '📱',
  '5g': '📱',
  '3g': '📱',
  '2g': '📱',
  'slow-2g': '📱',
  unknown: '❓',
  none: '⚠️',
};

/**
 * Get connection type label
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
 * Get connection type icon
 * @param {string} connectionType - Connection type
 * @param {string} effectiveType - Effective connection type
 * @returns {string} Icon emoji
 */
function getConnectionTypeIcon(connectionType, effectiveType) {
  // If connection type is cellular, use effective type for more specific icon
  if (connectionType === 'cellular' && effectiveType) {
    return CONNECTION_ICONS[effectiveType] || CONNECTION_ICONS.cellular;
  }
  return CONNECTION_ICONS[connectionType] || CONNECTION_ICONS.unknown;
}

/**
 * Format a timestamp into a readable date and time
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {Object} Object with formatted date and time
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

  return { date: dateStr, time: timeStr };
}

/**
 * Format speed value with unit
 * @param {number} speed - Speed in Mbps
 * @returns {string} Formatted speed string
 */
function formatSpeed(speed) {
  if (speed === null || speed === undefined) {
    return '—';
  }
  return `${speed.toFixed(2)} Mbps`;
}

/**
 * Format ping value with unit
 * @param {number} ping - Ping in milliseconds
 * @returns {string} Formatted ping string
 */
function formatPing(ping) {
  if (ping === null || ping === undefined) {
    return '—';
  }
  return `${ping.toFixed(0)} ms`;
}

/**
 * Create a table row element for a speed test result
 * @param {Object} result - Speed test result
 * @returns {HTMLTableRowElement} Table row element
 */
function createTableRow(result) {
  const row = document.createElement('tr');
  row.className = 'history-table__row';
  row.setAttribute('data-id', result.id);

  const { date, time } = formatTimestamp(result.timestamp);

  // Date column
  const dateCell = document.createElement('td');
  dateCell.className = 'history-table__cell history-table__cell--date';
  dateCell.innerHTML = `
    <div class="history-table__date">
      <span class="history-table__date-main">${date}</span>
      <span class="history-table__date-time">${time}</span>
    </div>
  `;

  // Connection type column
  const connectionCell = document.createElement('td');
  connectionCell.className = 'history-table__cell history-table__cell--connection';
  const connectionLabel = getConnectionTypeLabel(result.connection_type, result.effective_type);
  const connectionIcon = getConnectionTypeIcon(result.connection_type, result.effective_type);
  connectionCell.innerHTML = `
    <div class="history-table__connection">
      <span class="history-table__connection-icon">${connectionIcon}</span>
      <span class="history-table__connection-label">${connectionLabel}</span>
    </div>
  `;

  // Download column
  const downloadCell = document.createElement('td');
  downloadCell.className = 'history-table__cell history-table__cell--download';
  downloadCell.setAttribute('data-label', 'Descarga');
  downloadCell.textContent = formatSpeed(result.download_mbps);

  // Upload column
  const uploadCell = document.createElement('td');
  uploadCell.className = 'history-table__cell history-table__cell--upload';
  uploadCell.setAttribute('data-label', 'Subida');
  uploadCell.textContent = formatSpeed(result.upload_mbps);

  // Ping column
  const pingCell = document.createElement('td');
  pingCell.className = 'history-table__cell history-table__cell--ping';
  pingCell.setAttribute('data-label', 'Ping');
  pingCell.textContent = formatPing(result.ping_ms);

  row.appendChild(dateCell);
  row.appendChild(connectionCell);
  row.appendChild(downloadCell);
  row.appendChild(uploadCell);
  row.appendChild(pingCell);

  return row;
}

/**
 * Create the table header
 * @returns {HTMLTableSectionElement} Table header element
 */
function createTableHeader() {
  const thead = document.createElement('thead');
  thead.className = 'history-table__header';
  thead.innerHTML = `
    <tr class="history-table__header-row">
      <th class="history-table__header-cell history-table__header-cell--date">Fecha</th>
      <th class="history-table__header-cell history-table__header-cell--connection">Red</th>
      <th class="history-table__header-cell history-table__header-cell--download">Descarga</th>
      <th class="history-table__header-cell history-table__header-cell--upload">Subida</th>
      <th class="history-table__header-cell history-table__header-cell--ping">Ping</th>
    </tr>
  `;
  return thead;
}

/**
 * Create an empty state message
 * @returns {HTMLDivElement} Empty state element
 */
function createEmptyState() {
  const emptyState = document.createElement('div');
  emptyState.className = 'history-table__empty';
  emptyState.innerHTML = `
    <div class="history-table__empty-icon">📊</div>
    <p class="history-table__empty-title">No hay resultados guardados</p>
    <p class="history-table__empty-text">Realiza tu primer test de velocidad para ver el histórico aquí</p>
  `;
  return emptyState;
}

/**
 * Create and render a history table
 * @param {HTMLElement} container - Container element
 * @returns {Object} History table API
 */
export function createHistoryTable(container) {
  if (!container) {
    throw new Error('Container element is required');
  }

  let results = [];
  let tableElement = null;
  let emptyStateElement = null;

  /**
   * Render the table with current results
   */
  async function render() {
    // Clear container
    container.innerHTML = '';

    // Get results from database
    results = await getAllResults();

    if (results.length === 0) {
      // Show empty state
      emptyStateElement = createEmptyState();
      container.appendChild(emptyStateElement);
      return;
    }

    // Create table wrapper for responsiveness
    const wrapper = document.createElement('div');
    wrapper.className = 'history-table__wrapper';

    // Create table
    tableElement = document.createElement('table');
    tableElement.className = 'history-table';

    // Add header
    const header = createTableHeader();
    tableElement.appendChild(header);

    // Add body
    const tbody = document.createElement('tbody');
    tbody.className = 'history-table__body';

    results.forEach(result => {
      const row = createTableRow(result);
      tbody.appendChild(row);
    });

    tableElement.appendChild(tbody);
    wrapper.appendChild(tableElement);
    container.appendChild(wrapper);
  }

  /**
   * Refresh the table data
   */
  async function refresh() {
    await render();
  }

  /**
   * Get current results
   * @returns {Array} Current results
   */
  function getResults() {
    return results;
  }

  // Initial render
  render();

  // Public API
  return {
    render,
    refresh,
    getResults
  };
}
