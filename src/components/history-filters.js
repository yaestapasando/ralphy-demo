/**
 * History Filters Component
 * Provides filtering controls for the history table:
 * - Connection type multiselect
 * - Date range picker (from/to)
 * - Delete all history button
 */

import { clearAll } from '../services/database.js';
import { createConfirmationModal } from './confirmation-modal.js';

/**
 * Connection type options
 */
const CONNECTION_TYPE_OPTIONS = [
  { value: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { value: 'cellular', label: 'Datos móviles', icon: '📱' },
  { value: '5g', label: '5G', icon: '📱' },
  { value: '4g', label: '4G', icon: '📱' },
  { value: '3g', label: '3G', icon: '📱' },
  { value: '2g', label: '2G', icon: '📱' },
  { value: 'ethernet', label: 'Ethernet', icon: '🔌' },
  { value: 'bluetooth', label: 'Bluetooth', icon: '🔷' },
  { value: 'unknown', label: 'Desconocida', icon: '❓' }
];

/**
 * Create a checkbox element for a connection type
 * @param {Object} option - Connection type option
 * @param {boolean} checked - Whether the checkbox is checked
 * @returns {HTMLLabelElement} Label element containing checkbox
 */
function createConnectionTypeCheckbox(option, checked = false) {
  const label = document.createElement('label');
  label.className = 'history-filters__checkbox-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'history-filters__checkbox';
  checkbox.value = option.value;
  checkbox.checked = checked;

  const span = document.createElement('span');
  span.className = 'history-filters__checkbox-text';
  span.innerHTML = `${option.icon} ${option.label}`;

  label.appendChild(checkbox);
  label.appendChild(span);

  return label;
}

/**
 * Format date for input[type="date"]
 * @param {Date|string|null} date - Date to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
function formatDateForInput(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Create and render history filters
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Configuration options
 * @param {Function} options.onFilterChange - Callback when filters change
 * @param {Function} options.onExportCSV - Callback when export to CSV is requested
 * @param {Function} options.onExportJSON - Callback when export to JSON is requested
 * @returns {Object} History filters API
 */
export function createHistoryFilters(container, options = {}) {
  if (!container) {
    throw new Error('Container element is required');
  }

  const { onFilterChange, onClearAll, onExportCSV, onExportJSON } = options;

  let selectedConnectionTypes = [];
  let dateFrom = null;
  let dateTo = null;

  // Store checkbox elements
  const checkboxes = new Map();

  /**
   * Emit filter change event
   */
  function emitFilterChange() {
    if (typeof onFilterChange === 'function') {
      onFilterChange({
        connectionTypes: selectedConnectionTypes,
        dateFrom,
        dateTo
      });
    }
  }

  /**
   * Handle connection type checkbox change
   * @param {Event} event - Change event
   */
  function handleConnectionTypeChange(event) {
    const checkbox = event.target;
    const value = checkbox.value;

    if (checkbox.checked) {
      if (!selectedConnectionTypes.includes(value)) {
        selectedConnectionTypes.push(value);
      }
    } else {
      selectedConnectionTypes = selectedConnectionTypes.filter(v => v !== value);
    }

    emitFilterChange();
  }

  /**
   * Handle date from change
   * @param {Event} event - Change event
   */
  function handleDateFromChange(event) {
    dateFrom = event.target.value || null;
    emitFilterChange();
  }

  /**
   * Handle date to change
   * @param {Event} event - Change event
   */
  function handleDateToChange(event) {
    dateTo = event.target.value || null;
    emitFilterChange();
  }

  /**
   * Render the filters UI
   */
  function render() {
    // Clear container
    container.innerHTML = '';

    // Create filters wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'history-filters';

    // Connection type filter section
    const connectionSection = document.createElement('div');
    connectionSection.className = 'history-filters__section';

    const connectionLabel = document.createElement('label');
    connectionLabel.className = 'history-filters__label';
    connectionLabel.textContent = 'Tipo de conexión';

    const connectionGroup = document.createElement('div');
    connectionGroup.className = 'history-filters__checkbox-group';

    CONNECTION_TYPE_OPTIONS.forEach(option => {
      const checkbox = createConnectionTypeCheckbox(
        option,
        selectedConnectionTypes.includes(option.value)
      );

      // Store reference to checkbox input
      const checkboxInput = checkbox.querySelector('input');
      checkboxes.set(option.value, checkboxInput);

      // Add event listener
      checkboxInput.addEventListener('change', handleConnectionTypeChange);

      connectionGroup.appendChild(checkbox);
    });

    connectionSection.appendChild(connectionLabel);
    connectionSection.appendChild(connectionGroup);

    // Date range filter section
    const dateSection = document.createElement('div');
    dateSection.className = 'history-filters__section';

    const dateLabel = document.createElement('label');
    dateLabel.className = 'history-filters__label';
    dateLabel.textContent = 'Rango de fechas';

    const dateGroup = document.createElement('div');
    dateGroup.className = 'history-filters__date-group';

    // Date from input
    const dateFromWrapper = document.createElement('div');
    dateFromWrapper.className = 'history-filters__date-input-wrapper';

    const dateFromLabel = document.createElement('label');
    dateFromLabel.className = 'history-filters__date-label';
    dateFromLabel.textContent = 'Desde';

    const dateFromInput = document.createElement('input');
    dateFromInput.type = 'date';
    dateFromInput.className = 'history-filters__date-input';
    dateFromInput.value = formatDateForInput(dateFrom);
    dateFromInput.addEventListener('change', handleDateFromChange);

    dateFromWrapper.appendChild(dateFromLabel);
    dateFromWrapper.appendChild(dateFromInput);

    // Date to input
    const dateToWrapper = document.createElement('div');
    dateToWrapper.className = 'history-filters__date-input-wrapper';

    const dateToLabel = document.createElement('label');
    dateToLabel.className = 'history-filters__date-label';
    dateToLabel.textContent = 'Hasta';

    const dateToInput = document.createElement('input');
    dateToInput.type = 'date';
    dateToInput.className = 'history-filters__date-input';
    dateToInput.value = formatDateForInput(dateTo);
    dateToInput.addEventListener('change', handleDateToChange);

    dateToWrapper.appendChild(dateToLabel);
    dateToWrapper.appendChild(dateToInput);

    dateGroup.appendChild(dateFromWrapper);
    dateGroup.appendChild(dateToWrapper);

    dateSection.appendChild(dateLabel);
    dateSection.appendChild(dateGroup);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'history-filters__buttons';

    // Clear filters button
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'history-filters__clear-button';
    clearButton.textContent = 'Limpiar filtros';
    clearButton.addEventListener('click', () => {
      clear();
      emitFilterChange();
    });

    // Export CSV button
    const exportCSVButton = document.createElement('button');
    exportCSVButton.type = 'button';
    exportCSVButton.className = 'history-filters__export-button';
    exportCSVButton.textContent = '📥 Exportar a CSV';
    exportCSVButton.setAttribute('aria-label', 'Exportar histórico a CSV');
    exportCSVButton.addEventListener('click', handleExportCSV);

    // Export JSON button
    const exportJSONButton = document.createElement('button');
    exportJSONButton.type = 'button';
    exportJSONButton.className = 'history-filters__export-button';
    exportJSONButton.textContent = '📥 Exportar a JSON';
    exportJSONButton.setAttribute('aria-label', 'Exportar histórico a JSON');
    exportJSONButton.addEventListener('click', handleExportJSON);

    // Delete all button
    const deleteAllButton = document.createElement('button');
    deleteAllButton.type = 'button';
    deleteAllButton.className = 'history-filters__delete-all-button';
    deleteAllButton.textContent = '🗑️ Borrar todo el historial';
    deleteAllButton.setAttribute('aria-label', 'Borrar todo el historial');
    deleteAllButton.addEventListener('click', handleDeleteAll);

    buttonsContainer.appendChild(clearButton);
    buttonsContainer.appendChild(exportCSVButton);
    buttonsContainer.appendChild(exportJSONButton);
    buttonsContainer.appendChild(deleteAllButton);

    // Append all sections
    wrapper.appendChild(connectionSection);
    wrapper.appendChild(dateSection);
    wrapper.appendChild(buttonsContainer);

    container.appendChild(wrapper);
  }

  /**
   * Get current filters
   * @returns {Object} Current filter values
   */
  function getFilters() {
    return {
      connectionTypes: [...selectedConnectionTypes],
      dateFrom,
      dateTo
    };
  }

  /**
   * Set filters programmatically
   * @param {Object} filters - Filter values to set
   */
  function setFilters(filters) {
    if (filters.connectionTypes) {
      selectedConnectionTypes = [...filters.connectionTypes];
    }
    if (filters.dateFrom !== undefined) {
      dateFrom = filters.dateFrom;
    }
    if (filters.dateTo !== undefined) {
      dateTo = filters.dateTo;
    }

    // Re-render to update UI
    render();
  }

  /**
   * Clear all filters
   */
  function clear() {
    selectedConnectionTypes = [];
    dateFrom = null;
    dateTo = null;

    // Re-render to update UI
    render();
  }

  /**
   * Handle delete all history action
   * Shows confirmation modal before deleting
   */
  async function handleDeleteAll() {
    createConfirmationModal({
      title: 'Borrar todo el historial',
      message: '¿Está seguro de que desea eliminar todos los resultados del histórico? Esta acción no se puede deshacer.',
      confirmText: 'Borrar todo',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await clearAll();
          // Notify parent component
          if (typeof onClearAll === 'function') {
            onClearAll();
          }
        } catch (error) {
          console.error('Error clearing all results:', error);
          // Could show an error notification here
        }
      }
    });
  }

  /**
   * Handle export to CSV action
   * Calls the parent component callback to get the data and export it
   */
  function handleExportCSV() {
    if (typeof onExportCSV === 'function') {
      onExportCSV();
    }
  }

  /**
   * Handle export to JSON action
   * Calls the parent component callback to get the data and export it
   */
  function handleExportJSON() {
    if (typeof onExportJSON === 'function') {
      onExportJSON();
    }
  }

  /**
   * Check if any filters are active
   * @returns {boolean} True if any filters are active
   */
  function hasActiveFilters() {
    return selectedConnectionTypes.length > 0 || dateFrom !== null || dateTo !== null;
  }

  // Initial render
  render();

  // Public API
  return {
    render,
    getFilters,
    setFilters,
    clear,
    hasActiveFilters
  };
}
