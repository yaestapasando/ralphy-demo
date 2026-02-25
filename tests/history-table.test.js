/**
 * Unit tests for HistoryTable component.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHistoryTable } from '../src/components/history-table.js';
import { saveResult, clearAll, initDatabase, closeDatabase } from '../src/services/database.js';

describe('history-table component', () => {
  let container;

  beforeEach(async () => {
    // Initialize database
    await initDatabase();
    // Clear all existing data
    await clearAll();
    // Create a fresh container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    // Clean up DOM
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    // Clear database
    await clearAll();
    closeDatabase();
  });

  // ===========================================================================
  // Component initialization
  // ===========================================================================

  describe('component initialization', () => {
    it('requires a container element', () => {
      expect(() => createHistoryTable()).toThrow('Container element is required');
      expect(() => createHistoryTable(null)).toThrow('Container element is required');
    });

    it('returns an API object with expected methods', () => {
      const table = createHistoryTable(container);
      expect(table).toHaveProperty('render');
      expect(table).toHaveProperty('refresh');
      expect(table).toHaveProperty('getResults');
      expect(typeof table.render).toBe('function');
      expect(typeof table.refresh).toBe('function');
      expect(typeof table.getResults).toBe('function');
    });
  });

  // ===========================================================================
  // Empty state
  // ===========================================================================

  describe('empty state', () => {
    it('displays empty state when no results exist', async () => {
      createHistoryTable(container);
      // Wait for async render
      await new Promise(resolve => setTimeout(resolve, 100));

      const emptyState = container.querySelector('.history-table__empty');
      expect(emptyState).not.toBeNull();
      expect(emptyState.textContent).toContain('No hay resultados guardados');
    });

    it('does not display table when no results exist', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const table = container.querySelector('.history-table');
      expect(table).toBeNull();
    });
  });

  // ===========================================================================
  // Table rendering with data
  // ===========================================================================

  describe('table rendering with data', () => {
    it('displays table when results exist', async () => {
      // Add a test result
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const table = container.querySelector('.history-table');
      expect(table).not.toBeNull();
    });

    it('does not display empty state when results exist', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const emptyState = container.querySelector('.history-table__empty');
      expect(emptyState).toBeNull();
    });

    it('creates correct number of table rows', async () => {
      // Add three test results
      for (let i = 1; i <= 3; i++) {
        await saveResult({
          id: `test-${i}`,
          timestamp: `2026-02-24T1${i}:00:00Z`,
          download_mbps: 50 + i,
          upload_mbps: 20 + i,
          ping_ms: 10 + i,
          jitter_ms: 2 + i,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0'
        });
      }

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(3);
    });

    it('displays table header with correct columns', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const headerCells = container.querySelectorAll('.history-table__header-cell');
      expect(headerCells.length).toBe(6);
      expect(headerCells[0].textContent).toBe('Fecha');
      expect(headerCells[1].textContent).toBe('Red');
      expect(headerCells[2].textContent).toBe('Descarga');
      expect(headerCells[3].textContent).toBe('Subida');
      expect(headerCells[4].textContent).toBe('Ping');
      expect(headerCells[5].textContent).toBe('Acciones');
    });
  });

  // ===========================================================================
  // Data formatting
  // ===========================================================================

  describe('data formatting', () => {
    it('formats download speed correctly', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.456,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const downloadCell = container.querySelector('.history-table__cell--download');
      expect(downloadCell.textContent).toBe('95.46 Mbps');
    });

    it('formats upload speed correctly', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.123,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const uploadCell = container.querySelector('.history-table__cell--upload');
      expect(uploadCell.textContent).toBe('42.12 Mbps');
    });

    it('formats ping correctly as integer', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12.789,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const pingCell = container.querySelector('.history-table__cell--ping');
      expect(pingCell.textContent).toBe('13 ms');
    });

    it('handles null or undefined values gracefully', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: null,
        upload_mbps: undefined,
        ping_ms: null,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const downloadCell = container.querySelector('.history-table__cell--download');
      const uploadCell = container.querySelector('.history-table__cell--upload');
      const pingCell = container.querySelector('.history-table__cell--ping');

      expect(downloadCell.textContent).toBe('—');
      expect(uploadCell.textContent).toBe('—');
      expect(pingCell.textContent).toBe('—');
    });
  });

  // ===========================================================================
  // Date and time formatting
  // ===========================================================================

  describe('date and time formatting', () => {
    it('displays date in Spanish format (DD/MM/YYYY)', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const dateMain = container.querySelector('.history-table__date-main');
      expect(dateMain).not.toBeNull();
      expect(dateMain.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('displays time in 24-hour format (HH:MM:SS)', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:45Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const dateTime = container.querySelector('.history-table__date-time');
      expect(dateTime).not.toBeNull();
      expect(dateTime.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  // ===========================================================================
  // Connection type display
  // ===========================================================================

  describe('connection type display', () => {
    it('displays connection type icon and label', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const connectionIcon = container.querySelector('.history-table__connection-icon');
      const connectionLabel = container.querySelector('.history-table__connection-label');

      expect(connectionIcon).not.toBeNull();
      expect(connectionLabel).not.toBeNull();
      expect(connectionIcon.textContent.length).toBeGreaterThan(0);
      expect(connectionLabel.textContent.length).toBeGreaterThan(0);
    });

    it('displays different connection types correctly', async () => {
      const connectionTypes = [
        { type: 'wifi', effective: '4g' },
        { type: 'cellular', effective: '5g' },
        { type: 'ethernet', effective: '4g' },
      ];

      for (let i = 0; i < connectionTypes.length; i++) {
        await saveResult({
          id: `test-${i + 1}`,
          timestamp: `2026-02-24T1${i}:00:00Z`,
          download_mbps: 50 + i,
          upload_mbps: 20 + i,
          ping_ms: 10 + i,
          jitter_ms: 2 + i,
          connection_type: connectionTypes[i].type,
          effective_type: connectionTypes[i].effective,
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0'
        });
      }

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(3);
    });
  });

  // ===========================================================================
  // API methods
  // ===========================================================================

  describe('API methods', () => {
    it('refresh() re-renders the table with latest data', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initially empty
      let rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(0);

      // Add a result
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      // Refresh
      await table.refresh();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now should have one row
      rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
    });

    it('getResults() returns current results array', async () => {
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:30:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const results = table.getResults();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Sorting and ordering
  // ===========================================================================

  describe('sorting and ordering', () => {
    it('displays results in descending order by timestamp (newest first)', async () => {
      // Add results with different timestamps
      await saveResult({
        id: 'test-1',
        timestamp: '2026-02-24T10:00:00Z',
        download_mbps: 50,
        upload_mbps: 20,
        ping_ms: 10,
        jitter_ms: 2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      await saveResult({
        id: 'test-2',
        timestamp: '2026-02-24T12:00:00Z', // Newer
        download_mbps: 60,
        upload_mbps: 30,
        ping_ms: 15,
        jitter_ms: 3,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      await saveResult({
        id: 'test-3',
        timestamp: '2026-02-24T08:00:00Z', // Oldest
        download_mbps: 40,
        upload_mbps: 10,
        ping_ms: 5,
        jitter_ms: 1,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(3);

      // First row should be the newest (test-2, 60 Mbps)
      expect(rows[0].querySelector('.history-table__cell--download').textContent).toBe('60.00 Mbps');
      // Last row should be the oldest (test-3, 40 Mbps)
      expect(rows[2].querySelector('.history-table__cell--download').textContent).toBe('40.00 Mbps');
    });
  });

  // ===========================================================================
  // Filtering
  // ===========================================================================

  describe('filtering', () => {
    beforeEach(async () => {
      // Add test data with different connection types and dates
      await saveResult({
        id: 'wifi-1',
        timestamp: '2026-02-20T10:00:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      await saveResult({
        id: 'cellular-1',
        timestamp: '2026-02-22T14:00:00Z',
        download_mbps: 50.5,
        upload_mbps: 20.3,
        ping_ms: 45,
        jitter_ms: 8.1,
        connection_type: 'cellular',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      await saveResult({
        id: 'ethernet-1',
        timestamp: '2026-02-25T09:00:00Z',
        download_mbps: 120.7,
        upload_mbps: 60.4,
        ping_ms: 8,
        jitter_ms: 1.5,
        connection_type: 'ethernet',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });
    });

    it('filters by single connection type', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initially should show all 3 results
      let rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(3);

      // Filter by wifi only
      await table.setFilters({ connectionTypes: ['wifi'] });
      await new Promise(resolve => setTimeout(resolve, 50));

      rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
      expect(rows[0].getAttribute('data-id')).toBe('wifi-1');
    });

    it('filters by multiple connection types', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter by wifi and ethernet
      await table.setFilters({ connectionTypes: ['wifi', 'ethernet'] });
      await new Promise(resolve => setTimeout(resolve, 50));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(2);

      const ids = Array.from(rows).map(row => row.getAttribute('data-id'));
      expect(ids).toContain('wifi-1');
      expect(ids).toContain('ethernet-1');
      expect(ids).not.toContain('cellular-1');
    });

    it('filters by date from', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter from Feb 23 onwards
      await table.setFilters({ dateFrom: '2026-02-23' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
      expect(rows[0].getAttribute('data-id')).toBe('ethernet-1');
    });

    it('filters by date to', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter up to Feb 21
      await table.setFilters({ dateTo: '2026-02-21' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
      expect(rows[0].getAttribute('data-id')).toBe('wifi-1');
    });

    it('filters by date range', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter from Feb 21 to Feb 23
      await table.setFilters({
        dateFrom: '2026-02-21',
        dateTo: '2026-02-23'
      });
      await new Promise(resolve => setTimeout(resolve, 50));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
      expect(rows[0].getAttribute('data-id')).toBe('cellular-1');
    });

    it('combines connection type and date range filters', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add another wifi result in the date range
      await saveResult({
        id: 'wifi-2',
        timestamp: '2026-02-22T16:00:00Z',
        download_mbps: 88.2,
        upload_mbps: 38.5,
        ping_ms: 15,
        jitter_ms: 4.1,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      await table.refresh();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Filter by wifi and date range
      await table.setFilters({
        connectionTypes: ['wifi'],
        dateFrom: '2026-02-21',
        dateTo: '2026-02-23'
      });
      await new Promise(resolve => setTimeout(resolve, 50));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
      expect(rows[0].getAttribute('data-id')).toBe('wifi-2');
    });

    it('shows empty state when filters match no results', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter by bluetooth (no results have this type)
      await table.setFilters({ connectionTypes: ['bluetooth'] });
      await new Promise(resolve => setTimeout(resolve, 50));

      const emptyState = container.querySelector('.history-table__empty');
      expect(emptyState).not.toBeNull();

      const tableElement = container.querySelector('.history-table');
      expect(tableElement).toBeNull();
    });

    it('clears filters correctly', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set filters
      await table.setFilters({ connectionTypes: ['wifi'] });
      await new Promise(resolve => setTimeout(resolve, 50));

      let rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);

      // Clear filters
      await table.clearFilters();
      await new Promise(resolve => setTimeout(resolve, 50));

      rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(3);
    });

    it('getFilters returns current filter state', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const initialFilters = table.getFilters();
      expect(initialFilters).toEqual({
        connectionTypes: [],
        dateFrom: null,
        dateTo: null
      });

      await table.setFilters({
        connectionTypes: ['wifi', 'ethernet'],
        dateFrom: '2026-02-20',
        dateTo: '2026-02-25'
      });

      const updatedFilters = table.getFilters();
      expect(updatedFilters.connectionTypes).toEqual(['wifi', 'ethernet']);
      expect(updatedFilters.dateFrom).toBe('2026-02-20');
      expect(updatedFilters.dateTo).toBe('2026-02-25');
    });

    it('getResults returns filtered results', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      await table.setFilters({ connectionTypes: ['wifi'] });
      await new Promise(resolve => setTimeout(resolve, 50));

      const results = table.getResults();
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('wifi-1');
    });

    it('getAllResultsUnfiltered returns all results regardless of filters', async () => {
      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      await table.setFilters({ connectionTypes: ['wifi'] });
      await new Promise(resolve => setTimeout(resolve, 50));

      const filteredResults = table.getResults();
      expect(filteredResults.length).toBe(1);

      const allResults = table.getAllResultsUnfiltered();
      expect(allResults.length).toBe(3);
    });

    it('filters cellular connections by effective_type', async () => {
      // Add a 5G cellular result
      await saveResult({
        id: 'cellular-5g',
        timestamp: '2026-02-23T10:00:00Z',
        download_mbps: 150.5,
        upload_mbps: 50.3,
        ping_ms: 25,
        jitter_ms: 5.1,
        connection_type: 'cellular',
        effective_type: '5g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      const table = createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Filter by 5g effective type
      await table.setFilters({ connectionTypes: ['5g'] });
      await new Promise(resolve => setTimeout(resolve, 50));

      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
      expect(rows[0].getAttribute('data-id')).toBe('cellular-5g');
    });
  });

  // ===========================================================================
  // Delete functionality
  // ===========================================================================

  describe('delete functionality', () => {
    beforeEach(async () => {
      // Add test data
      await saveResult({
        id: 'delete-test-1',
        timestamp: '2026-02-20T10:00:00Z',
        download_mbps: 95.4,
        upload_mbps: 42.1,
        ping_ms: 12,
        jitter_ms: 3.2,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });

      await saveResult({
        id: 'delete-test-2',
        timestamp: '2026-02-22T14:00:00Z',
        download_mbps: 50.5,
        upload_mbps: 20.3,
        ping_ms: 45,
        jitter_ms: 8.1,
        connection_type: 'cellular',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0'
      });
    });

    it('displays delete button for each row', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const deleteButtons = container.querySelectorAll('.history-table__delete-btn');
      expect(deleteButtons.length).toBe(2);
    });

    it('delete button has correct accessibility attributes', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const deleteButton = container.querySelector('.history-table__delete-btn');
      expect(deleteButton).not.toBeNull();
      expect(deleteButton.hasAttribute('aria-label')).toBe(true);
      expect(deleteButton.getAttribute('aria-label')).toContain('Eliminar resultado');
    });

    it('clicking delete button opens confirmation modal', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const deleteButton = container.querySelector('.history-table__delete-btn');
      expect(deleteButton).not.toBeNull();

      // Click delete button
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Modal should be visible
      const modal = document.querySelector('.modal-backdrop');
      expect(modal).not.toBeNull();

      // Clean up modal
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });

    it('confirmation modal displays correct message', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const deleteButton = container.querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const modalTitle = document.querySelector('.modal__title');
      const modalMessage = document.querySelector('.modal__message');

      expect(modalTitle).not.toBeNull();
      expect(modalTitle.textContent).toBe('Eliminar resultado');
      expect(modalMessage).not.toBeNull();
      expect(modalMessage.textContent).toContain('¿Está seguro');

      // Clean up modal
      const modal = document.querySelector('.modal-backdrop');
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });

    it('clicking cancel button closes modal without deleting', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initial count
      let rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(2);

      const deleteButton = container.querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click cancel
      const cancelButton = document.querySelector('[data-action="cancel"]');
      expect(cancelButton).not.toBeNull();
      cancelButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Modal should be closed
      const modal = document.querySelector('.modal-backdrop');
      expect(modal).toBeNull();

      // Row count should remain the same
      rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(2);
    });

    it('clicking confirm button deletes the result', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initial count
      let rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(2);

      // Click delete on first row
      const deleteButton = rows[0].querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click confirm
      const confirmButton = document.querySelector('[data-action="confirm"]');
      expect(confirmButton).not.toBeNull();
      confirmButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Row count should be reduced
      rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);

      // Modal should be closed
      const modal = document.querySelector('.modal-backdrop');
      expect(modal).toBeNull();
    });

    it('deleting result updates the table with correct remaining data', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      let rows = container.querySelectorAll('.history-table__row');
      const secondRowId = rows[1].getAttribute('data-id');

      // Delete first row
      const deleteButton = rows[0].querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      const confirmButton = document.querySelector('[data-action="confirm"]');
      confirmButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Check that only the second row remains
      rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(1);
      expect(rows[0].getAttribute('data-id')).toBe(secondRowId);
    });

    it('deleting all results shows empty state', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Delete first result
      let deleteButton = container.querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      let confirmButton = document.querySelector('[data-action="confirm"]');
      confirmButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Delete second result
      deleteButton = container.querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      confirmButton = document.querySelector('[data-action="confirm"]');
      confirmButton.click();
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should show empty state
      const emptyState = container.querySelector('.history-table__empty');
      expect(emptyState).not.toBeNull();

      const table = container.querySelector('.history-table');
      expect(table).toBeNull();
    });

    it('pressing Escape key closes modal without deleting', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const deleteButton = container.querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Press Escape key
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Modal should be closed
      const modal = document.querySelector('.modal-backdrop');
      expect(modal).toBeNull();

      // Row count should remain the same
      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(2);
    });

    it('clicking backdrop closes modal without deleting', async () => {
      createHistoryTable(container);
      await new Promise(resolve => setTimeout(resolve, 100));

      const deleteButton = container.querySelector('.history-table__delete-btn');
      deleteButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Click backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      expect(backdrop).not.toBeNull();
      backdrop.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Modal should be closed
      const modal = document.querySelector('.modal-backdrop');
      expect(modal).toBeNull();

      // Row count should remain the same
      const rows = container.querySelectorAll('.history-table__row');
      expect(rows.length).toBe(2);
    });
  });
});
