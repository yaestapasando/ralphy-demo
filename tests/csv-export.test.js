/**
 * Unit tests for CSV export utility.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resultsToCSV, downloadCSV, exportResultsToCSV } from '../src/utils/csv-export.js';

describe('csv-export utility', () => {
  // ===========================================================================
  // resultsToCSV
  // ===========================================================================

  describe('resultsToCSV', () => {
    it('returns headers only for empty array', () => {
      const csv = resultsToCSV([]);
      expect(csv).toContain('Fecha,Tipo de Conexión,Descarga (Mbps),Subida (Mbps)');
      expect(csv.split('\n').length).toBe(2); // Header + empty line
    });

    it('converts single result to CSV format', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:30:00Z',
          download_mbps: 95.456,
          upload_mbps: 42.123,
          ping_ms: 12.789,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: '192.168.1.1'
        }
      ];

      const csv = resultsToCSV(results);
      const lines = csv.split('\n');

      expect(lines.length).toBe(2); // Header + 1 data row
      expect(lines[0]).toContain('Fecha');
      expect(lines[1]).toContain('Wi-Fi');
      expect(lines[1]).toContain('95.46');
      expect(lines[1]).toContain('42.12');
      expect(lines[1]).toContain('13'); // Ping rounded
    });

    it('converts multiple results to CSV format', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted'
        },
        {
          id: 'test-2',
          timestamp: '2026-02-24T11:00:00Z',
          download_mbps: 120.7,
          upload_mbps: 60.4,
          ping_ms: 8,
          jitter_ms: 1.5,
          connection_type: 'ethernet',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted'
        }
      ];

      const csv = resultsToCSV(results);
      const lines = csv.split('\n');

      expect(lines.length).toBe(3); // Header + 2 data rows
      expect(lines[1]).toContain('Wi-Fi');
      expect(lines[2]).toContain('Ethernet');
    });

    it('handles null and undefined values correctly', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: null,
          upload_mbps: undefined,
          ping_ms: null,
          jitter_ms: null,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: null,
          rtt_ms: null,
          server_used: null,
          ip_address: null
        }
      ];

      const csv = resultsToCSV(results);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('Wi-Fi');
      // Check that null/undefined values result in empty fields
      expect(lines[1]).toMatch(/,,/); // Empty fields between commas
    });

    it('escapes fields containing commas', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'server1, backup',
          ip_address: '192.168.1.1'
        }
      ];

      const csv = resultsToCSV(results);
      expect(csv).toContain('"server1, backup"');
    });

    it('escapes fields containing quotes', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'server "main"',
          ip_address: '192.168.1.1'
        }
      ];

      const csv = resultsToCSV(results);
      expect(csv).toContain('"server ""main"""');
    });

    it('formats cellular connections with effective type', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 50.5,
          upload_mbps: 20.3,
          ping_ms: 45,
          jitter_ms: 8.1,
          connection_type: 'cellular',
          effective_type: '5g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted'
        }
      ];

      const csv = resultsToCSV(results);
      expect(csv).toContain('5G'); // Should show 5G label instead of generic cellular
    });

    it('formats dates in Spanish locale', () => {
      const results = [
        {
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
          ip_address: 'redacted'
        }
      ];

      const csv = resultsToCSV(results);
      const lines = csv.split('\n');

      // Date should be in DD/MM/YYYY format and time in HH:MM:SS
      expect(lines[1]).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('formats numeric values with correct decimal places', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.456789,
          upload_mbps: 42.123456,
          ping_ms: 12.789,
          jitter_ms: 3.2567,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10.987654,
          rtt_ms: 50.456,
          server_used: 'auto',
          ip_address: 'redacted'
        }
      ];

      const csv = resultsToCSV(results);
      const lines = csv.split('\n');
      const values = lines[1].split(',');

      // Download and Upload should have 2 decimals
      expect(values[2]).toBe('95.46');
      expect(values[3]).toBe('42.12');

      // Ping and RTT should have 0 decimals (integers)
      expect(values[4]).toBe('13');
      expect(values[7]).toBe('50');

      // Jitter and Downlink should have 2 decimals
      expect(values[5]).toBe('3.26');
      expect(values[6]).toBe('10.99');
    });

    it('includes all required columns in correct order', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted'
        }
      ];

      const csv = resultsToCSV(results);
      const lines = csv.split('\n');
      const headers = lines[0].split(',');

      expect(headers[0]).toBe('Fecha');
      expect(headers[1]).toBe('Tipo de Conexión');
      expect(headers[2]).toBe('Descarga (Mbps)');
      expect(headers[3]).toBe('Subida (Mbps)');
      expect(headers[4]).toBe('Ping (ms)');
      expect(headers[5]).toBe('Jitter (ms)');
      expect(headers[6]).toBe('Downlink (Mbps)');
      expect(headers[7]).toBe('RTT (ms)');
      expect(headers[8]).toBe('Servidor');
      expect(headers[9]).toBe('IP');
    });
  });

  // ===========================================================================
  // downloadCSV
  // ===========================================================================

  describe('downloadCSV', () => {
    let createElementSpy;
    let appendChildSpy;
    let removeChildSpy;
    let clickSpy;
    let createObjectURLSpy;
    let revokeObjectURLSpy;

    beforeEach(() => {
      // Mock DOM methods
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {}
      };

      clickSpy = mockLink.click;

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      // Mock URL methods
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates a download link with correct attributes', () => {
      const csvContent = 'col1,col2\nval1,val2';
      downloadCSV(csvContent, 'test-file');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('triggers download with correct filename', () => {
      const csvContent = 'col1,col2\nval1,val2';

      downloadCSV(csvContent, 'test-file');

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test-file.csv');
    });

    it('uses default filename when not provided', () => {
      const csvContent = 'col1,col2\nval1,val2';

      downloadCSV(csvContent);

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'speed-test-history.csv');
    });

    it('adds BOM for UTF-8 encoding', () => {
      const csvContent = 'col1,col2\nval1,val2';

      downloadCSV(csvContent);

      // Check that Blob was created with BOM
      const blobConstructorCall = global.Blob;
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('cleans up after download', () => {
      const csvContent = 'col1,col2\nval1,val2';

      downloadCSV(csvContent);

      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  // ===========================================================================
  // exportResultsToCSV
  // ===========================================================================

  describe('exportResultsToCSV', () => {
    let createElementSpy;
    let appendChildSpy;
    let removeChildSpy;
    let createObjectURLSpy;
    let revokeObjectURLSpy;

    beforeEach(() => {
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {}
      };

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('exports results to CSV file', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted'
        }
      ];

      exportResultsToCSV(results);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('generates filename with date when not provided', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted'
        }
      ];

      exportResultsToCSV(results);

      const mockLink = createElementSpy.mock.results[0].value;
      // Should include date in filename
      const setDownloadCall = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      );
      expect(setDownloadCall[1]).toMatch(/speed-test-history-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('uses custom filename when provided', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12,
          jitter_ms: 3.2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted'
        }
      ];

      exportResultsToCSV(results, 'custom-name');

      const mockLink = createElementSpy.mock.results[0].value;
      const setDownloadCall = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      );
      expect(setDownloadCall[1]).toBe('custom-name.csv');
    });

    it('handles empty results array', () => {
      exportResultsToCSV([]);

      expect(createElementSpy).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });
});
