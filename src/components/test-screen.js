/**
 * TestScreen — Main test screen component.
 *
 * Orchestrates the speed test UI including:
 * - Network connection indicator in header
 * - Start/Stop button
 * - Animated gauge during test execution
 * - Results display after test completion
 * - Save results to database
 */

import { createConnectionIndicator } from './connection-indicator.js';
import { createSpeedGauge } from './speed-gauge.js';
import { createResultsScreen } from './results-screen.js';
import { runSpeedTest } from './speed-test.js';
import { saveResult } from '../services/database.js';
import { getConnectionInfo } from '../services/network-detection.js';

/**
 * Test screen states
 */
const STATE = {
  IDLE: 'idle',           // Ready to start test
  RUNNING: 'running',     // Test in progress
  COMPLETE: 'complete',   // Test completed, showing results
  ERROR: 'error',         // Test failed
};

/**
 * Phase display labels in Spanish
 */
const PHASE_LABELS = {
  ping: 'Latencia',
  download: 'Descarga',
  upload: 'Subida',
};

/**
 * Creates and manages the main test screen.
 *
 * @param {HTMLElement} container - DOM element to render into.
 * @returns {{ destroy(): void }}
 */
export function createTestScreen(container) {
  // State
  let currentState = STATE.IDLE;
  let abortController = null;
  let gauge = null;
  let resultsScreen = null;

  // Build DOM structure
  const root = document.createElement('div');
  root.className = 'test-screen';

  // Header with connection indicator
  const header = document.createElement('div');
  header.className = 'test-screen__header';

  const connectionContainer = document.createElement('div');
  connectionContainer.className = 'test-screen__connection';
  header.appendChild(connectionContainer);

  // Main content area
  const content = document.createElement('div');
  content.className = 'test-screen__content';

  // Gauge container
  const gaugeContainer = document.createElement('div');
  gaugeContainer.className = 'test-screen__gauge';
  content.appendChild(gaugeContainer);

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'test-screen__button-container';

  const startButton = document.createElement('button');
  startButton.className = 'test-screen__button test-screen__button--start';
  startButton.textContent = 'Iniciar Test';
  startButton.setAttribute('aria-label', 'Iniciar test de velocidad');
  buttonContainer.appendChild(startButton);

  content.appendChild(buttonContainer);

  // Results container (initially empty)
  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'test-screen__results';
  content.appendChild(resultsContainer);

  // Error message container
  const errorContainer = document.createElement('div');
  errorContainer.className = 'test-screen__error';
  errorContainer.setAttribute('role', 'alert');
  errorContainer.setAttribute('aria-live', 'polite');
  content.appendChild(errorContainer);

  root.appendChild(header);
  root.appendChild(content);
  container.appendChild(root);

  // Initialize connection indicator
  const connectionIndicator = createConnectionIndicator(connectionContainer);
  connectionIndicator.subscribe();

  // Initialize gauge
  gauge = createSpeedGauge(gaugeContainer, {
    max: 100,
    value: 0,
    unit: 'Mbps',
    label: 'Listo para comenzar',
  });

  /**
   * Updates the UI based on current state.
   */
  function updateUI() {
    switch (currentState) {
      case STATE.IDLE:
        startButton.textContent = 'Iniciar Test';
        startButton.className = 'test-screen__button test-screen__button--start';
        startButton.disabled = false;
        startButton.setAttribute('aria-label', 'Iniciar test de velocidad');
        errorContainer.style.display = 'none';
        errorContainer.textContent = '';
        resultsContainer.style.display = 'none';
        gaugeContainer.style.display = 'flex';
        gauge.setValue(0);
        gauge.setLabel('Listo para comenzar');
        break;

      case STATE.RUNNING:
        startButton.textContent = 'Detener Test';
        startButton.className = 'test-screen__button test-screen__button--stop';
        startButton.disabled = false;
        startButton.setAttribute('aria-label', 'Detener test de velocidad');
        errorContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        gaugeContainer.style.display = 'flex';
        break;

      case STATE.COMPLETE:
        startButton.textContent = 'Repetir Test';
        startButton.className = 'test-screen__button test-screen__button--start';
        startButton.disabled = false;
        startButton.setAttribute('aria-label', 'Repetir test de velocidad');
        errorContainer.style.display = 'none';
        gaugeContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        break;

      case STATE.ERROR:
        startButton.textContent = 'Reintentar';
        startButton.className = 'test-screen__button test-screen__button--start';
        startButton.disabled = false;
        startButton.setAttribute('aria-label', 'Reintentar test de velocidad');
        errorContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        gaugeContainer.style.display = 'flex';
        gauge.setValue(0);
        gauge.setLabel('');
        break;
    }
  }

  /**
   * Handles test completion.
   * @param {object} result - Speed test result.
   */
  async function handleComplete(result) {
    currentState = STATE.COMPLETE;
    updateUI();

    // Render results screen
    if (resultsScreen) {
      resultsScreen.destroy();
    }
    resultsScreen = createResultsScreen(resultsContainer, result);

    // Save to database
    try {
      const connectionInfo = getConnectionInfo();
      const timestamp = new Date().toISOString();

      await saveResult({
        timestamp,
        download_mbps: result.download,
        upload_mbps: result.upload,
        ping_ms: result.ping,
        jitter_ms: result.jitter,
        connection_type: connectionInfo.type,
        effective_type: connectionInfo.effectiveType,
        downlink_mbps: connectionInfo.downlink,
        rtt_ms: connectionInfo.rtt,
      });

      // Refresh history table if available
      if (window.historyTable) {
        window.historyTable.refresh();
      }
      if (window.historyStatistics) {
        window.historyStatistics.update(window.historyTable.getResults());
      }
      if (window.speedChart) {
        window.speedChart.update(window.historyTable.getResults());
      }
    } catch (err) {
      console.error('Failed to save test result:', err);
    }
  }

  /**
   * Handles test error.
   * @param {Error} error - Error object.
   */
  function handleError(error) {
    currentState = STATE.ERROR;
    updateUI();

    let message = 'Error durante el test de velocidad.';
    if (error.message) {
      message = error.message;
    }

    errorContainer.textContent = message;
  }

  /**
   * Starts the speed test.
   */
  async function startTest() {
    if (currentState === STATE.RUNNING) {
      // Stop the test
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      currentState = STATE.IDLE;
      updateUI();
      return;
    }

    // Reset state
    currentState = STATE.RUNNING;
    updateUI();

    // Create abort controller
    abortController = new AbortController();

    try {
      await runSpeedTest({
        onPhaseStart: (phase) => {
          const label = PHASE_LABELS[phase] || phase;
          const unit = phase === 'ping' ? 'ms' : 'Mbps';
          gauge.setPhase(label, unit);
          gauge.setValue(0);
        },
        onProgress: (_phase, value) => {
          gauge.setValue(value);
        },
        onPhaseEnd: (_phase, _result) => {
          // Phase complete
        },
        onComplete: handleComplete,
        onError: handleError,
      }, abortController.signal);
    } catch (err) {
      // Error already handled by onError callback
      if (err.name !== 'AbortError') {
        handleError(err);
      } else {
        // Test was aborted by user
        currentState = STATE.IDLE;
        updateUI();
      }
    } finally {
      abortController = null;
    }
  }

  // Event listeners
  startButton.addEventListener('click', startTest);

  // Initial UI state
  updateUI();

  /**
   * Cleanup function.
   */
  function destroy() {
    if (abortController) {
      abortController.abort();
    }
    if (gauge) {
      gauge.destroy();
    }
    if (resultsScreen) {
      resultsScreen.destroy();
    }
    if (connectionIndicator) {
      connectionIndicator.unsubscribe();
    }
    root.remove();
  }

  return { destroy };
}
