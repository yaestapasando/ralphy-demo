/**
 * Main application entry point.
 *
 * Initializes the connection indicator, history table, and sets up the app.
 */

import { createConnectionIndicator } from './components/connection-indicator.js';
import { createHistoryTable } from './components/history-table.js';
import { initDatabase } from './services/database.js';

// Initialize database
await initDatabase();

// Initialize connection indicator
const indicatorContainer = document.getElementById('connection-indicator-container');
if (indicatorContainer) {
  const indicator = createConnectionIndicator(indicatorContainer);
  // Subscribe to connection changes for automatic updates
  indicator.subscribe();
}

// Initialize history table
const historyContainer = document.getElementById('history-table-container');
if (historyContainer) {
  const historyTable = createHistoryTable(historyContainer);
  // Make it globally accessible for refreshing after new tests
  window.historyTable = historyTable;
}
