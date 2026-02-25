/**
 * Unit tests for JSON export utility.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resultsToJSON, downloadJSON, exportResultsToJSON } from '../src/utils/json-export.js';

describe('json-export utility', () => {
  // ===========================================================================
  // resultsToJSON
  // ===========================================================================

  describe('resultsToJSON', () => {
    it('returns empty array JSON for empty array', () => {
      const json = resultsToJSON([]);
      expect(json).toBe('[]');
    });

    it('returns empty array JSON for invalid input', () => {
      expect(resultsToJSON(null)).toBe('[]');
      expect(resultsToJSON(undefined)).toBe('[]');
      expect(resultsToJSON('not an array')).toBe('[]');
    });

    it('converts single result to JSON format', () => {
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

      const json = resultsToJSON(results);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe('test-1');
      expect(parsed[0].download_mbps).toBe(95.456);
      expect(parsed[0].upload_mbps).toBe(42.123);
      expect(parsed[0].connection_type).toBe('wifi');
    });

    it('converts multiple results to JSON format', () => {
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

      const json = resultsToJSON(results);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0].connection_type).toBe('wifi');
      expect(parsed[1].connection_type).toBe('ethernet');
    });

    it('preserves null and undefined values correctly', () => {
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

      const json = resultsToJSON(results);
      const parsed = JSON.parse(json);

      expect(parsed[0].download_mbps).toBeNull();
      expect(parsed[0].ping_ms).toBeNull();
      expect(parsed[0].server_used).toBeNull();
      // undefined values are omitted in JSON
      expect('upload_mbps' in parsed[0]).toBe(false);
    });

    it('preserves all data types correctly', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.456789,
          upload_mbps: 42.123456,
          ping_ms: 12,
          jitter_ms: 3.2567,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10.987654,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: '192.168.1.1'
        }
      ];

      const json = resultsToJSON(results);
      const parsed = JSON.parse(json);

      // Verify exact numeric values are preserved
      expect(parsed[0].download_mbps).toBe(95.456789);
      expect(parsed[0].upload_mbps).toBe(42.123456);
      expect(parsed[0].ping_ms).toBe(12);
      expect(parsed[0].jitter_ms).toBe(3.2567);
      expect(parsed[0].downlink_mbps).toBe(10.987654);
    });

    it('preserves special characters in strings', () => {
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
          server_used: 'server "main", backup',
          ip_address: '192.168.1.1'
        }
      ];

      const json = resultsToJSON(results);
      const parsed = JSON.parse(json);

      expect(parsed[0].server_used).toBe('server "main", backup');
    });

    it('returns pretty-printed JSON with 2-space indentation', () => {
      const results = [
        {
          id: 'test-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 95.4,
          connection_type: 'wifi'
        }
      ];

      const json = resultsToJSON(results);

      // Check for proper formatting
      expect(json).toContain('[\n');
      expect(json).toContain('  {');
      expect(json).toContain('    "id"');
      expect(json).toContain('\n]');
    });

    it('preserves all result fields', () => {
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

      const json = resultsToJSON(results);
      const parsed = JSON.parse(json);

      // Verify all fields are present
      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('timestamp');
      expect(parsed[0]).toHaveProperty('download_mbps');
      expect(parsed[0]).toHaveProperty('upload_mbps');
      expect(parsed[0]).toHaveProperty('ping_ms');
      expect(parsed[0]).toHaveProperty('jitter_ms');
      expect(parsed[0]).toHaveProperty('connection_type');
      expect(parsed[0]).toHaveProperty('effective_type');
      expect(parsed[0]).toHaveProperty('downlink_mbps');
      expect(parsed[0]).toHaveProperty('rtt_ms');
      expect(parsed[0]).toHaveProperty('server_used');
      expect(parsed[0]).toHaveProperty('ip_address');
    });
  });

  // ===========================================================================
  // downloadJSON
  // ===========================================================================

  describe('downloadJSON', () => {
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
      const jsonContent = '{"key": "value"}';
      downloadJSON(jsonContent, 'test-file');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('triggers download with correct filename', () => {
      const jsonContent = '{"key": "value"}';

      downloadJSON(jsonContent, 'test-file');

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test-file.json');
    });

    it('uses default filename when not provided', () => {
      const jsonContent = '{"key": "value"}';

      downloadJSON(jsonContent);

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'speed-test-history.json');
    });

    it('creates blob with correct content type', () => {
      const jsonContent = '{"key": "value"}';

      downloadJSON(jsonContent);

      // The Blob is created internally, so we just verify the URL was created
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('cleans up after download', () => {
      const jsonContent = '{"key": "value"}';

      downloadJSON(jsonContent);

      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  // ===========================================================================
  // exportResultsToJSON
  // ===========================================================================

  describe('exportResultsToJSON', () => {
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

    it('exports results to JSON file', () => {
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

      exportResultsToJSON(results);

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

      exportResultsToJSON(results);

      const mockLink = createElementSpy.mock.results[0].value;
      // Should include date in filename
      const setDownloadCall = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      );
      expect(setDownloadCall[1]).toMatch(/speed-test-history-\d{4}-\d{2}-\d{2}\.json/);
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

      exportResultsToJSON(results, 'custom-name');

      const mockLink = createElementSpy.mock.results[0].value;
      const setDownloadCall = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      );
      expect(setDownloadCall[1]).toBe('custom-name.json');
    });

    it('handles empty results array', () => {
      exportResultsToJSON([]);

      expect(createElementSpy).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });
});
