/**
 * Tests for IndexedDB database configuration and initialization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initDatabase,
  getDatabase,
  getDatabaseConfig,
  isIndexedDBSupported,
  saveResult,
  getAllResults,
  deleteResult,
  clearAll,
  closeDatabase
} from '../src/services/database.js';
import { deleteDB } from 'idb';

const DB_NAME = 'SpeedTestDB';
const STORE_NAME = 'speedTestResults';

describe('Database Configuration', () => {
  beforeEach(async () => {
    // Close any open connections and clean up database before each test
    closeDatabase();
    try {
      await deleteDB(DB_NAME);
    } catch (error) {
      // Ignore errors if DB doesn't exist
    }
  });

  afterEach(async () => {
    // Close connections and clean up database after each test
    closeDatabase();
    try {
      await deleteDB(DB_NAME);
    } catch (error) {
      // Ignore errors
    }
  });

  describe('getDatabaseConfig', () => {
    it('should return correct database configuration', () => {
      const config = getDatabaseConfig();

      expect(config).toEqual({
        dbName: 'SpeedTestDB',
        dbVersion: 1,
        storeName: 'speedTestResults'
      });
    });
  });

  describe('isIndexedDBSupported', () => {
    it('should return true when IndexedDB is available', () => {
      expect(isIndexedDBSupported()).toBe(true);
    });
  });

  describe('initDatabase', () => {
    it('should create and initialize the database', async () => {
      const db = await initDatabase();

      expect(db).toBeDefined();
      expect(db.name).toBe(DB_NAME);
      expect(db.version).toBe(1);

      db.close();
    });

    it('should create the speedTestResults object store', async () => {
      const db = await initDatabase();

      expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);

      db.close();
    });

    it('should create indexes on the object store', async () => {
      const db = await initDatabase();

      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      // Check that all expected indexes exist
      expect(store.indexNames.contains('timestamp')).toBe(true);
      expect(store.indexNames.contains('connection_type')).toBe(true);
      expect(store.indexNames.contains('download_mbps')).toBe(true);
      expect(store.indexNames.contains('upload_mbps')).toBe(true);

      await transaction.done;
      db.close();
    });

    it('should use id as the keyPath', async () => {
      const db = await initDatabase();

      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      expect(store.keyPath).toBe('id');

      await transaction.done;
      db.close();
    });

    it('should handle multiple calls without error', async () => {
      const db1 = await initDatabase();
      const db2 = await initDatabase();

      expect(db1.name).toBe(DB_NAME);
      expect(db2.name).toBe(DB_NAME);

      db1.close();
      db2.close();
    });
  });

  describe('getDatabase', () => {
    it('should open an existing database', async () => {
      // First initialize the database
      const dbInit = await initDatabase();
      dbInit.close();

      // Then open it again
      const db = await getDatabase();

      expect(db).toBeDefined();
      expect(db.name).toBe(DB_NAME);
      expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);

      db.close();
    });

    it('should create database if it does not exist', async () => {
      const db = await getDatabase();

      expect(db).toBeDefined();
      expect(db.name).toBe(DB_NAME);

      db.close();
    });
  });

  describe('Database Schema Validation', () => {
    it('should support storing SpeedTestResult objects with all required fields', async () => {
      const db = await initDatabase();

      const testResult = {
        id: 'test-uuid-123',
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
        user_agent: 'Mozilla/5.0...'
      };

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await store.add(testResult);
      await transaction.done;

      // Retrieve the stored object
      const readTransaction = db.transaction(STORE_NAME, 'readonly');
      const readStore = readTransaction.objectStore(STORE_NAME);
      const retrievedResult = await readStore.get('test-uuid-123');

      expect(retrievedResult).toEqual(testResult);

      await readTransaction.done;
      db.close();
    });

    it('should support querying by timestamp index', async () => {
      const db = await initDatabase();

      const testResult = {
        id: 'test-uuid-456',
        timestamp: '2026-02-24T15:00:00Z',
        download_mbps: 100,
        upload_mbps: 50,
        ping_ms: 10,
        jitter_ms: 2,
        connection_type: 'ethernet',
        effective_type: '4g',
        downlink_mbps: 100,
        rtt_ms: 10,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0...'
      };

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      await transaction.objectStore(STORE_NAME).add(testResult);
      await transaction.done;

      // Query by timestamp index
      const readTransaction = db.transaction(STORE_NAME, 'readonly');
      const index = readTransaction.objectStore(STORE_NAME).index('timestamp');
      const results = await index.getAll('2026-02-24T15:00:00Z');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-uuid-456');

      await readTransaction.done;
      db.close();
    });

    it('should support querying by connection_type index', async () => {
      const db = await initDatabase();

      const wifiResult = {
        id: 'wifi-test-1',
        timestamp: '2026-02-24T10:00:00Z',
        download_mbps: 80,
        upload_mbps: 40,
        ping_ms: 15,
        jitter_ms: 3,
        connection_type: 'wifi',
        effective_type: '4g',
        downlink_mbps: 10,
        rtt_ms: 50,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0...'
      };

      const cellularResult = {
        id: 'cellular-test-1',
        timestamp: '2026-02-24T11:00:00Z',
        download_mbps: 30,
        upload_mbps: 10,
        ping_ms: 45,
        jitter_ms: 8,
        connection_type: 'cellular',
        effective_type: '4g',
        downlink_mbps: 5,
        rtt_ms: 100,
        server_used: 'auto',
        ip_address: 'redacted',
        user_agent: 'Mozilla/5.0...'
      };

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.add(wifiResult);
      await store.add(cellularResult);
      await transaction.done;

      // Query by connection_type index
      const readTransaction = db.transaction(STORE_NAME, 'readonly');
      const index = readTransaction.objectStore(STORE_NAME).index('connection_type');
      const wifiResults = await index.getAll('wifi');

      expect(wifiResults).toHaveLength(1);
      expect(wifiResults[0].id).toBe('wifi-test-1');

      await readTransaction.done;
      db.close();
    });
  });

  describe('CRUD Operations', () => {

    describe('saveResult', () => {
      it('should save a valid speed test result', async () => {
        const result = {
          id: 'test-save-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100.5,
          upload_mbps: 50.2,
          ping_ms: 10,
          jitter_ms: 2.5,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const savedId = await saveResult(result);

        expect(savedId).toBe('test-save-1');

        // Verify it was actually saved by retrieving all results
        const results = await getAllResults();
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(result);
      });

      it('should update an existing result with the same id', async () => {
        const result1 = {
          id: 'test-update-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100,
          upload_mbps: 50,
          ping_ms: 10,
          jitter_ms: 2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result2 = {
          ...result1,
          download_mbps: 200,
          upload_mbps: 100
        };

        await saveResult(result1);
        await saveResult(result2);

        // Should have only one record
        const results = await getAllResults();
        expect(results).toHaveLength(1);
        expect(results[0].download_mbps).toBe(200);
        expect(results[0].upload_mbps).toBe(100);
      });

      it('should throw error for null or undefined result', async () => {
        await expect(saveResult(null)).rejects.toThrow('Invalid result: must be an object');
        await expect(saveResult(undefined)).rejects.toThrow('Invalid result: must be an object');
      });

      it('should throw error for non-object result', async () => {
        await expect(saveResult('string')).rejects.toThrow('Invalid result: must be an object');
        await expect(saveResult(123)).rejects.toThrow('Invalid result: must be an object');
      });

      it('should throw error for result without id', async () => {
        const invalidResult = {
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100
        };

        await expect(saveResult(invalidResult)).rejects.toThrow('Invalid result: missing required field "id"');
      });
    });

    describe('getAllResults', () => {
      it('should return empty array when no results exist', async () => {
        const results = await getAllResults();

        expect(results).toEqual([]);
      });

      it('should return all saved results', async () => {
        const result1 = {
          id: 'test-get-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100,
          upload_mbps: 50,
          ping_ms: 10,
          jitter_ms: 2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result2 = {
          id: 'test-get-2',
          timestamp: '2026-02-24T11:00:00Z',
          download_mbps: 80,
          upload_mbps: 40,
          ping_ms: 15,
          jitter_ms: 3,
          connection_type: 'cellular',
          effective_type: '4g',
          downlink_mbps: 5,
          rtt_ms: 100,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        await saveResult(result1);
        await saveResult(result2);

        const results = await getAllResults();

        expect(results).toHaveLength(2);
        expect(results).toEqual(expect.arrayContaining([result1, result2]));
      });

      it('should return results sorted by timestamp descending (newest first)', async () => {
        const result1 = {
          id: 'test-sort-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100,
          upload_mbps: 50,
          ping_ms: 10,
          jitter_ms: 2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result2 = {
          id: 'test-sort-2',
          timestamp: '2026-02-24T12:00:00Z',
          download_mbps: 90,
          upload_mbps: 45,
          ping_ms: 12,
          jitter_ms: 2.5,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result3 = {
          id: 'test-sort-3',
          timestamp: '2026-02-24T11:00:00Z',
          download_mbps: 95,
          upload_mbps: 48,
          ping_ms: 11,
          jitter_ms: 2.2,
          connection_type: 'ethernet',
          effective_type: '4g',
          downlink_mbps: 100,
          rtt_ms: 10,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        // Save in random order
        await saveResult(result2);
        await saveResult(result1);
        await saveResult(result3);

        const results = await getAllResults();

        // Should be sorted newest first
        expect(results[0].id).toBe('test-sort-2'); // 12:00
        expect(results[1].id).toBe('test-sort-3'); // 11:00
        expect(results[2].id).toBe('test-sort-1'); // 10:00
      });
    });

    describe('deleteResult', () => {
      it('should delete a specific result by id', async () => {
        const result1 = {
          id: 'test-delete-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100,
          upload_mbps: 50,
          ping_ms: 10,
          jitter_ms: 2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result2 = {
          id: 'test-delete-2',
          timestamp: '2026-02-24T11:00:00Z',
          download_mbps: 80,
          upload_mbps: 40,
          ping_ms: 15,
          jitter_ms: 3,
          connection_type: 'cellular',
          effective_type: '4g',
          downlink_mbps: 5,
          rtt_ms: 100,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        await saveResult(result1);
        await saveResult(result2);

        await deleteResult('test-delete-1');

        const results = await getAllResults();
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('test-delete-2');
      });

      it('should not throw error when deleting non-existent id', async () => {
        await expect(deleteResult('non-existent-id')).resolves.not.toThrow();
      });

      it('should throw error for invalid id (null, undefined, empty string)', async () => {
        await expect(deleteResult(null)).rejects.toThrow('Invalid ID: must be a non-empty string');
        await expect(deleteResult(undefined)).rejects.toThrow('Invalid ID: must be a non-empty string');
        await expect(deleteResult('')).rejects.toThrow('Invalid ID: must be a non-empty string');
      });

      it('should throw error for non-string id', async () => {
        await expect(deleteResult(123)).rejects.toThrow('Invalid ID: must be a non-empty string');
        await expect(deleteResult({})).rejects.toThrow('Invalid ID: must be a non-empty string');
      });
    });

    describe('clearAll', () => {
      it('should delete all results from the database', async () => {
        const result1 = {
          id: 'test-clear-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100,
          upload_mbps: 50,
          ping_ms: 10,
          jitter_ms: 2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result2 = {
          id: 'test-clear-2',
          timestamp: '2026-02-24T11:00:00Z',
          download_mbps: 80,
          upload_mbps: 40,
          ping_ms: 15,
          jitter_ms: 3,
          connection_type: 'cellular',
          effective_type: '4g',
          downlink_mbps: 5,
          rtt_ms: 100,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result3 = {
          id: 'test-clear-3',
          timestamp: '2026-02-24T12:00:00Z',
          download_mbps: 90,
          upload_mbps: 45,
          ping_ms: 12,
          jitter_ms: 2.5,
          connection_type: 'ethernet',
          effective_type: '4g',
          downlink_mbps: 100,
          rtt_ms: 10,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        await saveResult(result1);
        await saveResult(result2);
        await saveResult(result3);

        // Verify we have 3 results
        let results = await getAllResults();
        expect(results).toHaveLength(3);

        await clearAll();

        // Verify all results are deleted
        results = await getAllResults();
        expect(results).toHaveLength(0);
      });

      it('should not throw error when clearing empty database', async () => {
        await expect(clearAll()).resolves.not.toThrow();

        const results = await getAllResults();
        expect(results).toHaveLength(0);
      });

      it('should allow saving new results after clearing', async () => {
        const result1 = {
          id: 'test-clear-save-1',
          timestamp: '2026-02-24T10:00:00Z',
          download_mbps: 100,
          upload_mbps: 50,
          ping_ms: 10,
          jitter_ms: 2,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        const result2 = {
          id: 'test-clear-save-2',
          timestamp: '2026-02-24T11:00:00Z',
          download_mbps: 80,
          upload_mbps: 40,
          ping_ms: 15,
          jitter_ms: 3,
          connection_type: 'cellular',
          effective_type: '4g',
          downlink_mbps: 5,
          rtt_ms: 100,
          server_used: 'auto',
          ip_address: 'redacted',
          user_agent: 'Mozilla/5.0...'
        };

        await saveResult(result1);
        await clearAll();
        await saveResult(result2);

        const results = await getAllResults();
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('test-clear-save-2');
      });
    });
  });
});
