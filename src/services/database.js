/**
 * IndexedDB configuration and management for SpeedTest results
 * Uses the idb library for a cleaner Promise-based API
 */

import { openDB } from 'idb';

const DB_NAME = 'SpeedTestDB';
const DB_VERSION = 1;
const STORE_NAME = 'speedTestResults';

// Singleton database instance
let dbInstance = null;

/**
 * Database schema for SpeedTestResult
 * @typedef {Object} SpeedTestResult
 * @property {string} id - UUID v4 identifier
 * @property {string} timestamp - ISO 8601 timestamp (e.g., "2026-02-24T10:30:00Z")
 * @property {number} download_mbps - Download speed in Mbps
 * @property {number} upload_mbps - Upload speed in Mbps
 * @property {number} ping_ms - Ping/latency in milliseconds
 * @property {number} jitter_ms - Jitter (latency variation) in milliseconds
 * @property {string} connection_type - Type of connection: 'wifi', 'cellular', 'ethernet', 'bluetooth', 'unknown'
 * @property {string} effective_type - Effective connection type: '4g', '3g', '2g', 'slow-2g', 'unknown'
 * @property {number} downlink_mbps - Estimated downlink from Network Information API
 * @property {number} rtt_ms - Round-trip time from Network Information API
 * @property {string} server_used - Server identifier used for the test
 * @property {string} ip_address - User's IP address (can be 'redacted' for privacy)
 * @property {string} user_agent - Browser user agent string
 */

/**
 * Initialize and open the IndexedDB database
 * Creates the object store and indexes on first run or upgrade
 * Uses a singleton pattern to prevent multiple concurrent connections
 * @returns {Promise<import('idb').IDBPDatabase>} Database instance
 */
export async function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id'
        });

        // Create indexes for efficient querying
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('connection_type', 'connection_type', { unique: false });
        store.createIndex('download_mbps', 'download_mbps', { unique: false });
        store.createIndex('upload_mbps', 'upload_mbps', { unique: false });

        console.log(`Created object store: ${STORE_NAME}`);
      }
    },
    blocked() {
      console.warn('Database upgrade blocked by another tab');
    },
    blocking() {
      console.warn('This connection is blocking a database upgrade');
    },
    terminated() {
      console.error('Database connection was unexpectedly terminated');
      dbInstance = null;
    }
  });

  return dbInstance;
}

/**
 * Get the database instance
 * Opens the database if not already open
 * @returns {Promise<import('idb').IDBPDatabase>} Database instance
 */
export async function getDatabase() {
  return await initDatabase();
}

/**
 * Get the database configuration constants
 * @returns {Object} Configuration object
 */
export function getDatabaseConfig() {
  return {
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    storeName: STORE_NAME
  };
}

/**
 * Check if IndexedDB is supported in the current browser
 * @returns {boolean} True if IndexedDB is supported
 */
export function isIndexedDBSupported() {
  return typeof indexedDB !== 'undefined';
}

/**
 * Save a speed test result to the database
 * @param {SpeedTestResult} result - The speed test result to save
 * @returns {Promise<string>} The ID of the saved result
 * @throws {Error} If the result is invalid or save fails
 */
export async function saveResult(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid result: must be an object');
  }

  if (!result.id) {
    throw new Error('Invalid result: missing required field "id"');
  }

  const db = await getDatabase();

  try {
    await db.put(STORE_NAME, result);
    return result.id;
  } catch (error) {
    throw new Error(`Failed to save result: ${error.message}`, { cause: error });
  }
}

/**
 * Get all speed test results from the database
 * Results are sorted by timestamp in descending order (newest first)
 * @returns {Promise<SpeedTestResult[]>} Array of all speed test results
 */
export async function getAllResults() {
  const db = await getDatabase();

  try {
    const results = await db.getAll(STORE_NAME);

    // Sort by timestamp descending (newest first)
    return results.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  } catch (error) {
    throw new Error(`Failed to retrieve results: ${error.message}`, { cause: error });
  }
}

/**
 * Delete a specific speed test result by ID
 * @param {string} id - The ID of the result to delete
 * @returns {Promise<void>}
 * @throws {Error} If the ID is invalid or delete fails
 */
export async function deleteResult(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID: must be a non-empty string');
  }

  const db = await getDatabase();

  try {
    await db.delete(STORE_NAME, id);
  } catch (error) {
    throw new Error(`Failed to delete result: ${error.message}`, { cause: error });
  }
}

/**
 * Delete all speed test results from the database
 * @returns {Promise<void>}
 */
export async function clearAll() {
  const db = await getDatabase();

  try {
    await db.clear(STORE_NAME);
  } catch (error) {
    throw new Error(`Failed to clear all results: ${error.message}`, { cause: error });
  }
}

/**
 * Close the database connection and reset the singleton instance
 * Primarily used for testing purposes
 * @returns {void}
 */
export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
