/**
 * IndexedDB configuration and management for SpeedTest results
 * Uses the idb library for a cleaner Promise-based API
 */

import { openDB } from 'idb';

const DB_NAME = 'SpeedTestDB';
const DB_VERSION = 1;
const STORE_NAME = 'speedTestResults';

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
 * @returns {Promise<import('idb').IDBPDatabase>} Database instance
 */
export async function initDatabase() {
  const db = await openDB(DB_NAME, DB_VERSION, {
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
    }
  });

  return db;
}

/**
 * Get the database instance
 * Opens the database if not already open
 * @returns {Promise<import('idb').IDBPDatabase>} Database instance
 */
export async function getDatabase() {
  return await openDB(DB_NAME, DB_VERSION);
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
