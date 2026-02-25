/**
 * Unit tests for HistoryFilters component.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHistoryFilters } from '../src/components/history-filters.js';
import * as database from '../src/services/database.js';
import * as confirmationModal from '../src/components/confirmation-modal.js';

// Mock the database module
vi.mock('../src/services/database.js', () => ({
  clearAll: vi.fn(() => Promise.resolve())
}));

// Mock the confirmation modal module
vi.mock('../src/components/confirmation-modal.js', () => ({
  createConfirmationModal: vi.fn((options) => {
    // Immediately call onConfirm for testing purposes
    if (options.onConfirm) {
      options.onConfirm();
    }
    return {
      open: vi.fn(),
      close: vi.fn()
    };
  })
}));

describe('history-filters component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  // ===========================================================================
  // Component initialization
  // ===========================================================================

  describe('component initialization', () => {
    it('requires a container element', () => {
      expect(() => createHistoryFilters()).toThrow('Container element is required');
      expect(() => createHistoryFilters(null)).toThrow('Container element is required');
    });

    it('returns an API object with expected methods', () => {
      const filters = createHistoryFilters(container);
      expect(filters).toHaveProperty('render');
      expect(filters).toHaveProperty('getFilters');
      expect(filters).toHaveProperty('setFilters');
      expect(filters).toHaveProperty('clear');
      expect(filters).toHaveProperty('hasActiveFilters');
      expect(typeof filters.render).toBe('function');
      expect(typeof filters.getFilters).toBe('function');
      expect(typeof filters.setFilters).toBe('function');
      expect(typeof filters.clear).toBe('function');
      expect(typeof filters.hasActiveFilters).toBe('function');
    });

    it('renders the filters UI', () => {
      createHistoryFilters(container);
      const filtersElement = container.querySelector('.history-filters');
      expect(filtersElement).not.toBeNull();
    });
  });

  // ===========================================================================
  // Connection type filter
  // ===========================================================================

  describe('connection type filter', () => {
    it('displays connection type section', () => {
      createHistoryFilters(container);
      const sections = container.querySelectorAll('.history-filters__section');
      expect(sections.length).toBeGreaterThanOrEqual(1);

      const labels = container.querySelectorAll('.history-filters__label');
      const connectionLabel = Array.from(labels).find(
        label => label.textContent === 'Tipo de conexión'
      );
      expect(connectionLabel).not.toBeNull();
    });

    it('displays all connection type checkboxes', () => {
      createHistoryFilters(container);
      const checkboxes = container.querySelectorAll('.history-filters__checkbox');

      // Should have at least the main connection types
      expect(checkboxes.length).toBeGreaterThanOrEqual(7);

      const values = Array.from(checkboxes).map(cb => cb.value);
      expect(values).toContain('wifi');
      expect(values).toContain('cellular');
      expect(values).toContain('ethernet');
      expect(values).toContain('4g');
      expect(values).toContain('5g');
    });

    it('allows selecting connection types', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');

      expect(wifiCheckbox).not.toBeNull();
      wifiCheckbox.click();

      expect(wifiCheckbox.checked).toBe(true);
      expect(onFilterChange).toHaveBeenCalled();

      const filterValues = filters.getFilters();
      expect(filterValues.connectionTypes).toContain('wifi');
    });

    it('allows selecting multiple connection types', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      const checkboxes = container.querySelectorAll('.history-filters__checkbox');
      const wifiCheckbox = Array.from(checkboxes).find(cb => cb.value === 'wifi');
      const ethernetCheckbox = Array.from(checkboxes).find(cb => cb.value === 'ethernet');

      wifiCheckbox.click();
      ethernetCheckbox.click();

      expect(wifiCheckbox.checked).toBe(true);
      expect(ethernetCheckbox.checked).toBe(true);

      const filterValues = filters.getFilters();
      expect(filterValues.connectionTypes).toContain('wifi');
      expect(filterValues.connectionTypes).toContain('ethernet');
      expect(filterValues.connectionTypes.length).toBe(2);
    });

    it('allows deselecting connection types', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');

      // Select
      wifiCheckbox.click();
      expect(wifiCheckbox.checked).toBe(true);

      // Deselect
      wifiCheckbox.click();
      expect(wifiCheckbox.checked).toBe(false);

      const filterValues = filters.getFilters();
      expect(filterValues.connectionTypes).not.toContain('wifi');
    });

    it('calls onFilterChange when connection type is toggled', () => {
      const onFilterChange = vi.fn();
      createHistoryFilters(container, { onFilterChange });

      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');

      wifiCheckbox.click();

      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTypes: ['wifi']
        })
      );
    });
  });

  // ===========================================================================
  // Date range filter
  // ===========================================================================

  describe('date range filter', () => {
    it('displays date range section', () => {
      createHistoryFilters(container);
      const labels = container.querySelectorAll('.history-filters__label');
      const dateLabel = Array.from(labels).find(
        label => label.textContent === 'Rango de fechas'
      );
      expect(dateLabel).not.toBeNull();
    });

    it('displays date from and date to inputs', () => {
      createHistoryFilters(container);
      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      expect(dateInputs.length).toBe(2);

      const dateLabels = container.querySelectorAll('.history-filters__date-label');
      expect(dateLabels.length).toBe(2);

      const labelsText = Array.from(dateLabels).map(l => l.textContent);
      expect(labelsText).toContain('Desde');
      expect(labelsText).toContain('Hasta');
    });

    it('allows setting date from', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      const dateFromInput = dateInputs[0];

      dateFromInput.value = '2026-02-01';
      dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onFilterChange).toHaveBeenCalled();

      const filterValues = filters.getFilters();
      expect(filterValues.dateFrom).toBe('2026-02-01');
    });

    it('allows setting date to', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      const dateToInput = dateInputs[1];

      dateToInput.value = '2026-02-28';
      dateToInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onFilterChange).toHaveBeenCalled();

      const filterValues = filters.getFilters();
      expect(filterValues.dateTo).toBe('2026-02-28');
    });

    it('allows setting both date from and date to', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      const dateFromInput = dateInputs[0];
      const dateToInput = dateInputs[1];

      dateFromInput.value = '2026-02-01';
      dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));

      dateToInput.value = '2026-02-28';
      dateToInput.dispatchEvent(new Event('change', { bubbles: true }));

      const filterValues = filters.getFilters();
      expect(filterValues.dateFrom).toBe('2026-02-01');
      expect(filterValues.dateTo).toBe('2026-02-28');
    });

    it('calls onFilterChange when dates are set', () => {
      const onFilterChange = vi.fn();
      createHistoryFilters(container, { onFilterChange });

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      const dateFromInput = dateInputs[0];

      dateFromInput.value = '2026-02-01';
      dateFromInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: '2026-02-01'
        })
      );
    });
  });

  // ===========================================================================
  // Clear filters
  // ===========================================================================

  describe('clear filters', () => {
    it('displays clear filters button', () => {
      createHistoryFilters(container);
      const clearButton = container.querySelector('.history-filters__clear-button');
      expect(clearButton).not.toBeNull();
      expect(clearButton.textContent).toBe('Limpiar filtros');
    });

    it('clears all filters when button is clicked', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      // Set some filters
      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      wifiCheckbox.click();

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      dateInputs[0].value = '2026-02-01';
      dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

      // Clear filters
      const clearButton = container.querySelector('.history-filters__clear-button');
      clearButton.click();

      const filterValues = filters.getFilters();
      expect(filterValues.connectionTypes).toHaveLength(0);
      expect(filterValues.dateFrom).toBeNull();
      expect(filterValues.dateTo).toBeNull();
    });

    it('calls onFilterChange when clear button is clicked', () => {
      const onFilterChange = vi.fn();
      createHistoryFilters(container, { onFilterChange });

      // Set a filter first
      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      wifiCheckbox.click();

      onFilterChange.mockClear();

      // Clear filters
      const clearButton = container.querySelector('.history-filters__clear-button');
      clearButton.click();

      expect(onFilterChange).toHaveBeenCalledWith({
        connectionTypes: [],
        dateFrom: null,
        dateTo: null
      });
    });

    it('updates UI when clear() method is called', () => {
      const filters = createHistoryFilters(container);

      // Set filters
      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      wifiCheckbox.click();

      expect(wifiCheckbox.checked).toBe(true);

      // Clear programmatically
      filters.clear();

      // Check UI is updated
      const updatedCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      expect(updatedCheckbox.checked).toBe(false);
    });
  });

  // ===========================================================================
  // Get and set filters
  // ===========================================================================

  describe('get and set filters', () => {
    it('getFilters returns current filter state', () => {
      const filters = createHistoryFilters(container);

      const initialFilters = filters.getFilters();
      expect(initialFilters).toEqual({
        connectionTypes: [],
        dateFrom: null,
        dateTo: null
      });
    });

    it('setFilters updates the filter state', () => {
      const filters = createHistoryFilters(container);

      filters.setFilters({
        connectionTypes: ['wifi', 'ethernet'],
        dateFrom: '2026-02-01',
        dateTo: '2026-02-28'
      });

      const currentFilters = filters.getFilters();
      expect(currentFilters.connectionTypes).toEqual(['wifi', 'ethernet']);
      expect(currentFilters.dateFrom).toBe('2026-02-01');
      expect(currentFilters.dateTo).toBe('2026-02-28');
    });

    it('setFilters updates the UI', () => {
      const filters = createHistoryFilters(container);

      filters.setFilters({
        connectionTypes: ['wifi'],
        dateFrom: '2026-02-01'
      });

      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      expect(wifiCheckbox.checked).toBe(true);

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      expect(dateInputs[0].value).toBe('2026-02-01');
    });

    it('setFilters allows partial updates', () => {
      const filters = createHistoryFilters(container);

      filters.setFilters({
        connectionTypes: ['wifi']
      });

      filters.setFilters({
        dateFrom: '2026-02-01'
      });

      const currentFilters = filters.getFilters();
      expect(currentFilters.connectionTypes).toEqual(['wifi']);
      expect(currentFilters.dateFrom).toBe('2026-02-01');
    });
  });

  // ===========================================================================
  // Active filters detection
  // ===========================================================================

  describe('active filters detection', () => {
    it('hasActiveFilters returns false initially', () => {
      const filters = createHistoryFilters(container);
      expect(filters.hasActiveFilters()).toBe(false);
    });

    it('hasActiveFilters returns true when connection type is selected', () => {
      const filters = createHistoryFilters(container);

      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      wifiCheckbox.click();

      expect(filters.hasActiveFilters()).toBe(true);
    });

    it('hasActiveFilters returns true when date from is set', () => {
      const filters = createHistoryFilters(container);

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      dateInputs[0].value = '2026-02-01';
      dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

      expect(filters.hasActiveFilters()).toBe(true);
    });

    it('hasActiveFilters returns true when date to is set', () => {
      const filters = createHistoryFilters(container);

      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      dateInputs[1].value = '2026-02-28';
      dateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));

      expect(filters.hasActiveFilters()).toBe(true);
    });

    it('hasActiveFilters returns false after clearing filters', () => {
      const filters = createHistoryFilters(container);

      // Set filters
      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      wifiCheckbox.click();

      expect(filters.hasActiveFilters()).toBe(true);

      // Clear
      filters.clear();

      expect(filters.hasActiveFilters()).toBe(false);
    });
  });

  // ===========================================================================
  // Delete all history
  // ===========================================================================

  describe('delete all history', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('displays delete all button', () => {
      createHistoryFilters(container);
      const deleteAllButton = container.querySelector('.history-filters__delete-all-button');
      expect(deleteAllButton).not.toBeNull();
      expect(deleteAllButton.textContent).toContain('Borrar todo el historial');
    });

    it('shows confirmation modal when delete all button is clicked', () => {
      createHistoryFilters(container);
      const deleteAllButton = container.querySelector('.history-filters__delete-all-button');

      // Click the button
      deleteAllButton.click();

      // Check that modal was created with correct parameters
      expect(confirmationModal.createConfirmationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Borrar todo el historial',
          message: expect.stringContaining('¿Está seguro de que desea eliminar todos los resultados del histórico?'),
          confirmText: 'Borrar todo',
          cancelText: 'Cancelar'
        })
      );
    });

    it('calls clearAll and onClearAll when confirmed', async () => {
      const onClearAll = vi.fn();
      createHistoryFilters(container, { onClearAll });

      const deleteAllButton = container.querySelector('.history-filters__delete-all-button');
      deleteAllButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(database.clearAll).toHaveBeenCalled();
      expect(onClearAll).toHaveBeenCalled();
    });

    it('does not call clearAll when cancelled', () => {
      // Mock the modal to call onCancel instead
      confirmationModal.createConfirmationModal.mockImplementationOnce((options) => {
        if (options.onCancel) {
          options.onCancel();
        }
        return {
          open: vi.fn(),
          close: vi.fn()
        };
      });

      const onClearAll = vi.fn();
      createHistoryFilters(container, { onClearAll });

      const deleteAllButton = container.querySelector('.history-filters__delete-all-button');
      deleteAllButton.click();

      // Verify clearAll was not called
      expect(database.clearAll).not.toHaveBeenCalled();
      expect(onClearAll).not.toHaveBeenCalled();
    });

    it('handles errors gracefully when clearAll fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Database error');
      database.clearAll.mockRejectedValueOnce(mockError);

      const onClearAll = vi.fn();
      createHistoryFilters(container, { onClearAll });

      const deleteAllButton = container.querySelector('.history-filters__delete-all-button');
      deleteAllButton.click();

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error clearing all results:', mockError);

      // onClearAll should not be called on error
      expect(onClearAll).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Export CSV functionality
  // ===========================================================================

  describe('export CSV functionality', () => {
    it('displays export CSV button', () => {
      createHistoryFilters(container);
      const exportButton = container.querySelector('.history-filters__export-button');
      expect(exportButton).not.toBeNull();
      expect(exportButton.textContent).toContain('Exportar a CSV');
    });

    it('export button has correct accessibility attributes', () => {
      createHistoryFilters(container);
      const exportButton = container.querySelector('.history-filters__export-button');
      expect(exportButton.getAttribute('aria-label')).toBe('Exportar histórico a CSV');
    });

    it('calls onExportCSV callback when export button is clicked', () => {
      const onExportCSV = vi.fn();
      createHistoryFilters(container, { onExportCSV });

      const exportButton = container.querySelector('.history-filters__export-button');
      exportButton.click();

      expect(onExportCSV).toHaveBeenCalled();
    });

    it('does not throw error when onExportCSV is not provided', () => {
      createHistoryFilters(container);
      const exportButton = container.querySelector('.history-filters__export-button');

      expect(() => exportButton.click()).not.toThrow();
    });

    it('export button is always enabled regardless of filters', () => {
      const filters = createHistoryFilters(container);
      const exportButton = container.querySelector('.history-filters__export-button');

      // Initially enabled
      expect(exportButton.disabled).toBe(false);

      // Still enabled after setting filters
      filters.setFilters({
        connectionTypes: ['wifi'],
        dateFrom: '2026-02-01',
        dateTo: '2026-02-28'
      });

      expect(exportButton.disabled).toBe(false);
    });
  });

  // ===========================================================================
  // Integration scenarios
  // ===========================================================================

  describe('integration scenarios', () => {
    it('handles complex filter combinations', () => {
      const onFilterChange = vi.fn();
      const filters = createHistoryFilters(container, { onFilterChange });

      // Select multiple connection types
      const checkboxes = container.querySelectorAll('.history-filters__checkbox');
      const wifiCheckbox = Array.from(checkboxes).find(cb => cb.value === 'wifi');
      const cellularCheckbox = Array.from(checkboxes).find(cb => cb.value === 'cellular');
      const fourGCheckbox = Array.from(checkboxes).find(cb => cb.value === '4g');

      wifiCheckbox.click();
      cellularCheckbox.click();
      fourGCheckbox.click();

      // Set date range
      const dateInputs = container.querySelectorAll('.history-filters__date-input');
      dateInputs[0].value = '2026-02-01';
      dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      dateInputs[1].value = '2026-02-28';
      dateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));

      const currentFilters = filters.getFilters();
      expect(currentFilters.connectionTypes).toHaveLength(3);
      expect(currentFilters.connectionTypes).toContain('wifi');
      expect(currentFilters.connectionTypes).toContain('cellular');
      expect(currentFilters.connectionTypes).toContain('4g');
      expect(currentFilters.dateFrom).toBe('2026-02-01');
      expect(currentFilters.dateTo).toBe('2026-02-28');
    });

    it('maintains state through re-renders', () => {
      const filters = createHistoryFilters(container);

      // Set some filters
      const wifiCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      wifiCheckbox.click();

      // Re-render
      filters.render();

      // Check state is maintained
      const updatedCheckbox = Array.from(
        container.querySelectorAll('.history-filters__checkbox')
      ).find(cb => cb.value === 'wifi');
      expect(updatedCheckbox.checked).toBe(true);
    });
  });
});
