/**
 * Main application entry point.
 *
 * Initializes the navigation, connection indicator, history filters, history table, and sets up the app.
 */

import { createNavigation } from './components/navigation.js';
import { createConnectionIndicator } from './components/connection-indicator.js';
import { createHistoryFilters } from './components/history-filters.js';
import { createHistoryTable } from './components/history-table.js';
import { createHistoryStatistics } from './components/history-statistics.js';
import { createSpeedChart } from './components/speed-chart.js';
import { initDatabase } from './services/database.js';
import { exportResultsToCSV } from './utils/csv-export.js';
import { exportResultsToJSON } from './utils/json-export.js';

// Initialize database
await initDatabase();

/**
 * Switches between views (Test and History)
 * @param {string} viewName - The view to activate ('test' or 'history')
 */
function switchToView(viewName) {
  const views = document.querySelectorAll('.app-view');
  views.forEach(view => {
    const isActive = view.id === `${viewName}-view`;
    view.classList.toggle('app-view--active', isActive);
    view.setAttribute('aria-hidden', !isActive);
  });
}

/**
 * Gets the initial view from URL hash or defaults to 'test'
 * @returns {string} The initial view name
 */
function getInitialView() {
  const hash = window.location.hash.slice(1);
  return hash === 'history' ? 'history' : 'test';
}

// Initialize navigation
const navigationContainer = document.getElementById('navigation-container');
let navigation = null;

if (navigationContainer) {
  const initialView = getInitialView();

  navigation = createNavigation(navigationContainer, {
    initialView,
    onViewChange: (newView) => {
      switchToView(newView);
    }
  });

  // Set initial view
  switchToView(initialView);

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const view = getInitialView();
    navigation.setView(view);
    switchToView(view);
  });
}

// Initialize connection indicator (now in the navigation bar)
const indicatorContainer = document.getElementById('connection-indicator-container');
if (indicatorContainer) {
  const indicator = createConnectionIndicator(indicatorContainer);
  // Subscribe to connection changes for automatic updates
  indicator.subscribe();
}

// Initialize speed chart
const chartContainer = document.getElementById('speed-chart-container');
let speedChart = null;
if (chartContainer) {
  speedChart = createSpeedChart(chartContainer);
}

// Initialize history statistics
const statisticsContainer = document.getElementById('history-statistics-container');
let historyStatistics = null;
if (statisticsContainer) {
  historyStatistics = createHistoryStatistics(statisticsContainer);
}

// Initialize history table
const historyContainer = document.getElementById('history-table-container');
if (historyContainer) {
  const historyTable = createHistoryTable(historyContainer);

  // Register callback to update statistics when table data changes
  historyTable.onChange((results) => {
    if (historyStatistics) {
      historyStatistics.update(results);
    }
  });

  // Initialize history filters
  const filtersContainer = document.getElementById('history-filters-container');
  if (filtersContainer) {
    createHistoryFilters(filtersContainer, {
      onFilterChange: (filters) => {
        historyTable.setFilters(filters);
        // Update statistics and chart with filtered results
        if (historyStatistics) {
          historyStatistics.update(historyTable.getResults());
        }
        if (speedChart) {
          speedChart.update(historyTable.getResults());
        }
      },
      onClearAll: () => {
        // Refresh table, statistics and chart after clearing all history
        historyTable.refresh();
        if (historyStatistics) {
          historyStatistics.update(historyTable.getResults());
        }
        if (speedChart) {
          speedChart.update(historyTable.getResults());
        }
      },
      onExportCSV: () => {
        // Export current filtered results to CSV
        const results = historyTable.getResults();
        if (results.length > 0) {
          exportResultsToCSV(results);
        } else {
          // Could show a notification that there are no results to export
          console.warn('No results to export');
        }
      },
      onExportJSON: () => {
        // Export current filtered results to JSON
        const results = historyTable.getResults();
        if (results.length > 0) {
          exportResultsToJSON(results);
        } else {
          // Could show a notification that there are no results to export
          console.warn('No results to export');
        }
      }
    });
  }

  // Update statistics and chart with initial data
  if (historyStatistics) {
    historyStatistics.update(historyTable.getResults());
  }
  if (speedChart) {
    speedChart.update(historyTable.getResults());
  }

  // Make it globally accessible for refreshing after new tests
  window.historyTable = historyTable;
  window.historyStatistics = historyStatistics;
  window.speedChart = speedChart;
}
