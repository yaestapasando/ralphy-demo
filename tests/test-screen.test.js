/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestScreen } from '../src/components/test-screen.js';

// Mock all dependencies
vi.mock('../src/components/connection-indicator.js', () => ({
  createConnectionIndicator: vi.fn(() => ({
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
}));

vi.mock('../src/components/speed-gauge.js', () => ({
  createSpeedGauge: vi.fn(() => ({
    setValue: vi.fn(),
    setLabel: vi.fn(),
    setPhase: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock('../src/components/results-screen.js', () => ({
  createResultsScreen: vi.fn(() => ({
    update: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock('../src/components/speed-test.js', () => ({
  runSpeedTest: vi.fn(),
}));

vi.mock('../src/services/database.js', () => ({
  saveResult: vi.fn(),
}));

vi.mock('../src/services/network-detection.js', () => ({
  getConnectionInfo: vi.fn(() => ({
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  })),
}));

// Import mocked modules
import { createConnectionIndicator } from '../src/components/connection-indicator.js';
import { createSpeedGauge } from '../src/components/speed-gauge.js';
import { createResultsScreen } from '../src/components/results-screen.js';
import { runSpeedTest } from '../src/components/speed-test.js';
import { saveResult } from '../src/services/database.js';
import { getConnectionInfo } from '../src/services/network-detection.js';

describe('createTestScreen', () => {
  let container;
  let mockGauge;
  let mockConnectionIndicator;
  let mockResultsScreen;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Setup mock return values
    mockGauge = {
      setValue: vi.fn(),
      setLabel: vi.fn(),
      setPhase: vi.fn(),
      destroy: vi.fn(),
    };
    createSpeedGauge.mockReturnValue(mockGauge);

    mockConnectionIndicator = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };
    createConnectionIndicator.mockReturnValue(mockConnectionIndicator);

    mockResultsScreen = {
      update: vi.fn(),
      destroy: vi.fn(),
    };
    createResultsScreen.mockReturnValue(mockResultsScreen);

    // Mock successful speed test
    runSpeedTest.mockResolvedValue({
      ping: 12.5,
      jitter: 1.8,
      download: 95.4,
      upload: 42.1,
    });

    // Mock successful database save
    saveResult.mockResolvedValue(undefined);

    // Reset global historyTable references
    window.historyTable = undefined;
    window.historyStatistics = undefined;
    window.speedChart = undefined;
  });

  afterEach(() => {
    // Cleanup DOM
    document.body.removeChild(container);
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  describe('initialization', () => {
    it('creates and renders the test screen structure', () => {
      createTestScreen(container);

      const testScreen = container.querySelector('.test-screen');
      expect(testScreen).toBeTruthy();

      const header = testScreen.querySelector('.test-screen__header');
      expect(header).toBeTruthy();

      const content = testScreen.querySelector('.test-screen__content');
      expect(content).toBeTruthy();

      const gaugeContainer = testScreen.querySelector('.test-screen__gauge');
      expect(gaugeContainer).toBeTruthy();

      const buttonContainer = testScreen.querySelector('.test-screen__button-container');
      expect(buttonContainer).toBeTruthy();

      const resultsContainer = testScreen.querySelector('.test-screen__results');
      expect(resultsContainer).toBeTruthy();

      const errorContainer = testScreen.querySelector('.test-screen__error');
      expect(errorContainer).toBeTruthy();
    });

    it('initializes the connection indicator', () => {
      createTestScreen(container);

      expect(createConnectionIndicator).toHaveBeenCalled();
      expect(mockConnectionIndicator.subscribe).toHaveBeenCalled();
    });

    it('initializes the speed gauge', () => {
      createTestScreen(container);

      expect(createSpeedGauge).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          max: 100,
          value: 0,
          unit: 'Mbps',
          label: 'Listo para comenzar',
        })
      );
    });

    it('creates a start button with correct initial state', () => {
      createTestScreen(container);

      const button = container.querySelector('.test-screen__button');
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Iniciar Test');
      expect(button.className).toContain('test-screen__button--start');
      expect(button.disabled).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Button interactions
  // ---------------------------------------------------------------------------

  describe('start button', () => {
    it('starts the test when clicked', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();

      expect(runSpeedTest).toHaveBeenCalled();
    });

    it('changes to "Detener Test" when test is running', async () => {
      let resolveTest;
      runSpeedTest.mockImplementation(() => new Promise(resolve => {
        resolveTest = resolve;
      }));

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(button.textContent).toBe('Detener Test');
      expect(button.className).toContain('test-screen__button--stop');

      resolveTest({ ping: 10, jitter: 2, download: 50, upload: 25 });
    });

    it('stops the test when clicked during running state', async () => {
      let testCallbacks;
      runSpeedTest.mockImplementation((callbacks) => {
        testCallbacks = callbacks;
        return new Promise(() => {}); // Never resolves
      });

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      // Start test
      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(button.textContent).toBe('Detener Test');

      // Stop test
      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(button.textContent).toBe('Iniciar Test');
    });

    it('changes to "Repetir Test" after test completes', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(button.textContent).toBe('Repetir Test');
    });

    it('changes to "Reintentar" after test fails', async () => {
      runSpeedTest.mockRejectedValue(new Error('Test failed'));

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(button.textContent).toBe('Reintentar');
    });
  });

  // ---------------------------------------------------------------------------
  // Speed test orchestration
  // ---------------------------------------------------------------------------

  describe('speed test orchestration', () => {
    it('calls runSpeedTest with proper callbacks', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(runSpeedTest).toHaveBeenCalledWith(
        expect.objectContaining({
          onPhaseStart: expect.any(Function),
          onProgress: expect.any(Function),
          onPhaseEnd: expect.any(Function),
          onComplete: expect.any(Function),
          onError: expect.any(Function),
        }),
        expect.any(AbortSignal)
      );
    });

    it('updates gauge when onPhaseStart is called', async () => {
      let callbacks;
      runSpeedTest.mockImplementation((cb) => {
        callbacks = cb;
        return new Promise(() => {});
      });

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      callbacks.onPhaseStart('download');

      expect(mockGauge.setPhase).toHaveBeenCalledWith('Descarga', 'Mbps');
      expect(mockGauge.setValue).toHaveBeenCalledWith(0);
    });

    it('updates gauge when onProgress is called', async () => {
      let callbacks;
      runSpeedTest.mockImplementation((cb) => {
        callbacks = cb;
        return new Promise(() => {});
      });

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      callbacks.onProgress('download', 85.5);

      expect(mockGauge.setValue).toHaveBeenCalledWith(85.5);
    });

    it('uses correct phase labels in Spanish', async () => {
      let callbacks;
      runSpeedTest.mockImplementation((cb) => {
        callbacks = cb;
        return new Promise(() => {});
      });

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      callbacks.onPhaseStart('ping');
      expect(mockGauge.setPhase).toHaveBeenCalledWith('Latencia', 'ms');

      callbacks.onPhaseStart('download');
      expect(mockGauge.setPhase).toHaveBeenCalledWith('Descarga', 'Mbps');

      callbacks.onPhaseStart('upload');
      expect(mockGauge.setPhase).toHaveBeenCalledWith('Subida', 'Mbps');
    });
  });

  // ---------------------------------------------------------------------------
  // Results display
  // ---------------------------------------------------------------------------

  describe('results display', () => {
    it('creates results screen when test completes', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(createResultsScreen).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          ping: 12.5,
          jitter: 1.8,
          download: 95.4,
          upload: 42.1,
        })
      );
    });

    it('displays results container and hides gauge container', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const resultsContainer = container.querySelector('.test-screen__results');
      const gaugeContainer = container.querySelector('.test-screen__gauge');

      expect(resultsContainer.style.display).toBe('block');
      expect(gaugeContainer.style.display).toBe('none');
    });

    it('destroys previous results screen before creating new one', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      // First test
      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const firstResultsScreen = mockResultsScreen;

      // Second test
      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(firstResultsScreen.destroy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Database persistence
  // ---------------------------------------------------------------------------

  describe('database persistence', () => {
    it('saves results to database when test completes', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(saveResult).toHaveBeenCalledWith(
        expect.objectContaining({
          download_mbps: 95.4,
          upload_mbps: 42.1,
          ping_ms: 12.5,
          jitter_ms: 1.8,
          connection_type: 'wifi',
          effective_type: '4g',
          downlink_mbps: 10,
          rtt_ms: 50,
        })
      );
    });

    it('includes timestamp in saved result', async () => {
      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(saveResult).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });

    it('refreshes history table after saving results', async () => {
      const mockHistoryTable = {
        refresh: vi.fn(),
        getResults: vi.fn(() => []),
      };
      window.historyTable = mockHistoryTable;

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHistoryTable.refresh).toHaveBeenCalled();
    });

    it('handles database save errors gracefully', async () => {
      saveResult.mockRejectedValue(new Error('Database error'));

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still show results even if save fails
      expect(createResultsScreen).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('displays error message when test fails', async () => {
      runSpeedTest.mockRejectedValue(new Error('Network error'));

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const errorContainer = container.querySelector('.test-screen__error');
      expect(errorContainer.style.display).toBe('block');
      expect(errorContainer.textContent).toContain('Network error');
    });

    it('hides error message when starting new test', async () => {
      runSpeedTest.mockRejectedValueOnce(new Error('First error'));
      runSpeedTest.mockResolvedValueOnce({ ping: 10, jitter: 2, download: 50, upload: 25 });

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      // First test (fails)
      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      const errorContainer = container.querySelector('.test-screen__error');
      expect(errorContainer.style.display).toBe('block');

      // Second test (succeeds)
      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorContainer.style.display).toBe('none');
    });

    it('handles abort errors gracefully', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      runSpeedTest.mockRejectedValue(abortError);

      createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      // Click again to abort
      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should return to idle state without showing error
      expect(button.textContent).toBe('Iniciar Test');
    });
  });

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  describe('cleanup', () => {
    it('provides a destroy method', () => {
      const screen = createTestScreen(container);

      expect(screen.destroy).toBeInstanceOf(Function);
    });

    it('cleans up gauge on destroy', () => {
      const screen = createTestScreen(container);
      screen.destroy();

      expect(mockGauge.destroy).toHaveBeenCalled();
    });

    it('unsubscribes from connection indicator on destroy', () => {
      const screen = createTestScreen(container);
      screen.destroy();

      expect(mockConnectionIndicator.unsubscribe).toHaveBeenCalled();
    });

    it('cleans up results screen if present on destroy', async () => {
      const screen = createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      screen.destroy();

      expect(mockResultsScreen.destroy).toHaveBeenCalled();
    });

    it('aborts running test on destroy', async () => {
      let testCallbacks;
      runSpeedTest.mockImplementation((callbacks) => {
        testCallbacks = callbacks;
        return new Promise(() => {}); // Never resolves
      });

      const screen = createTestScreen(container);
      const button = container.querySelector('.test-screen__button');

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      screen.destroy();

      // Verify DOM is removed
      expect(container.querySelector('.test-screen')).toBeNull();
    });

    it('removes DOM elements on destroy', () => {
      const screen = createTestScreen(container);
      screen.destroy();

      expect(container.querySelector('.test-screen')).toBeNull();
    });
  });
});
