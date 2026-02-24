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
      expect(headerCells.length).toBe(5);
      expect(headerCells[0].textContent).toBe('Fecha');
      expect(headerCells[1].textContent).toBe('Red');
      expect(headerCells[2].textContent).toBe('Descarga');
      expect(headerCells[3].textContent).toBe('Subida');
      expect(headerCells[4].textContent).toBe('Ping');
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
});
