/**
 * Main application entry point.
 *
 * Initializes the connection indicator and sets up the app.
 */

import { createConnectionIndicator } from './components/connection-indicator.js';

// Initialize connection indicator
const indicatorContainer = document.getElementById('connection-indicator-container');
if (indicatorContainer) {
  const indicator = createConnectionIndicator(indicatorContainer);
  // Subscribe to connection changes for automatic updates
  indicator.subscribe();
}
