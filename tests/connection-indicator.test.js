/**
 * Unit tests for ConnectionIndicator component.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createConnectionIndicator,
  determineDisplayType,
  getBrowserSupportMessage,
} from '../src/components/connection-indicator.js';
import * as networkDetection from '../src/services/network-detection.js';
import * as networkFallback from '../src/services/network-fallback.js';

describe('determineDisplayType', () => {
  it('should return "unknown" when API is not supported', () => {
    const result = determineDisplayType({
      supported: false,
      type: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
    });

    expect(result).toBe('unknown');
  });

  it('should return "none" when connection type is none', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'none',
      effectiveType: null,
      downlink: null,
      rtt: null,
    });

    expect(result).toBe('none');
  });

  it('should return effectiveType for cellular connections when available', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'cellular',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    });

    expect(result).toBe('4g');
  });

  it('should return "cellular" when effectiveType is not recognized', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'cellular',
      effectiveType: 'unknown-type',
      downlink: 5,
      rtt: 100,
    });

    expect(result).toBe('cellular');
  });

  it('should return "cellular" when effectiveType is null for cellular connection', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'cellular',
      effectiveType: null,
      downlink: 5,
      rtt: 100,
    });

    expect(result).toBe('cellular');
  });

  it('should return type directly for non-cellular connections', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    expect(result).toBe('wifi');
  });

  it('should handle ethernet connection', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'ethernet',
      effectiveType: null,
      downlink: 100,
      rtt: 5,
    });

    expect(result).toBe('ethernet');
  });

  it('should handle bluetooth connection', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'bluetooth',
      effectiveType: null,
      downlink: 1,
      rtt: 150,
    });

    expect(result).toBe('bluetooth');
  });

  it('should return "unknown" for unrecognized connection types', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'unknown-type',
      effectiveType: null,
      downlink: null,
      rtt: null,
    });

    expect(result).toBe('unknown');
  });

  it('should handle 3G effective type', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'cellular',
      effectiveType: '3g',
      downlink: 2,
      rtt: 100,
    });

    expect(result).toBe('3g');
  });

  it('should handle 2G effective type', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'cellular',
      effectiveType: '2g',
      downlink: 0.5,
      rtt: 200,
    });

    expect(result).toBe('2g');
  });

  it('should handle slow-2g effective type', () => {
    const result = determineDisplayType({
      supported: true,
      type: 'cellular',
      effectiveType: 'slow-2g',
      downlink: 0.1,
      rtt: 500,
    });

    expect(result).toBe('slow-2g');
  });
});

describe('createConnectionIndicator', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should create and render the indicator in the container', () => {
    const indicator = createConnectionIndicator(container);

    const root = container.querySelector('.connection-indicator');
    expect(root).toBeTruthy();
    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-live')).toBe('polite');

    const icon = root.querySelector('.connection-indicator__icon');
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('aria-hidden')).toBe('true');

    const label = root.querySelector('.connection-indicator__label');
    expect(label).toBeTruthy();

    indicator.destroy();
  });

  it('should update with Wi-Fi connection info', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--wifi');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('Wi-Fi');

    expect(root.getAttribute('aria-label')).toBe('Conectado a Wi-Fi');

    indicator.destroy();
  });

  it('should update with cellular 4G connection info', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'cellular',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--4g');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('4G');

    expect(root.getAttribute('aria-label')).toBe('Conectado a red 4G');

    indicator.destroy();
  });

  it('should update with ethernet connection info', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'ethernet',
      effectiveType: null,
      downlink: 100,
      rtt: 5,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--ethernet');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('Ethernet');

    indicator.destroy();
  });

  it('should update with offline status', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'none',
      effectiveType: null,
      downlink: null,
      rtt: null,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--none');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('Sin conexión');

    indicator.destroy();
  });

  it('should update with unknown connection when API is not supported', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: false,
      type: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--unknown');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('Desconocida');

    indicator.destroy();
  });

  it('should render SVG icon for each connection type', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const icon = container.querySelector('.connection-indicator__icon svg');
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');

    indicator.destroy();
  });

  it('should subscribe to connection changes', () => {
    const mockUnsubscribe = vi.fn();
    vi.spyOn(networkDetection, 'onConnectionChange').mockImplementation((callback) => {
      callback({
        supported: true,
        type: 'wifi',
        effectiveType: null,
        downlink: 50,
        rtt: 20,
      });
      return mockUnsubscribe;
    });

    const indicator = createConnectionIndicator(container);
    const unsubscribe = indicator.subscribe();

    expect(networkDetection.onConnectionChange).toHaveBeenCalled();

    const label = container.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('Wi-Fi');

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();

    indicator.destroy();
  });

  it('should update dynamically when connection changes', () => {
    let callback;
    vi.spyOn(networkDetection, 'onConnectionChange').mockImplementation((cb) => {
      callback = cb;
      cb({
        supported: true,
        type: 'wifi',
        effectiveType: null,
        downlink: 50,
        rtt: 20,
      });
      return vi.fn();
    });

    const indicator = createConnectionIndicator(container);
    indicator.subscribe();

    let label = container.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('Wi-Fi');

    // Simulate connection change to cellular
    callback({
      supported: true,
      type: 'cellular',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
    });

    label = container.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('4G');

    indicator.destroy();
  });

  it('should remove the indicator from DOM when destroyed', () => {
    const indicator = createConnectionIndicator(container);

    const root = container.querySelector('.connection-indicator');
    expect(root).toBeTruthy();

    indicator.destroy();

    const rootAfterDestroy = container.querySelector('.connection-indicator');
    expect(rootAfterDestroy).toBeNull();
  });

  it('should handle bluetooth connection', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'bluetooth',
      effectiveType: null,
      downlink: 1,
      rtt: 150,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--bluetooth');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('Bluetooth');

    indicator.destroy();
  });

  it('should handle 3G cellular connection', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'cellular',
      effectiveType: '3g',
      downlink: 2,
      rtt: 100,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--3g');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('3G');

    indicator.destroy();
  });

  it('should handle slow-2g cellular connection', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'cellular',
      effectiveType: 'slow-2g',
      downlink: 0.1,
      rtt: 500,
    });

    const root = container.querySelector('.connection-indicator');
    expect(root.className).toContain('connection-indicator--slow-2g');

    const label = root.querySelector('.connection-indicator__label');
    expect(label.textContent).toBe('2G lenta');

    indicator.destroy();
  });
});

describe('getBrowserSupportMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return supported message when API is available', () => {
    vi.spyOn(networkFallback, 'parseBrowserInfo').mockReturnValue({
      browser: 'chrome',
      mobile: false,
      os: 'windows',
    });

    const message = getBrowserSupportMessage(true);
    expect(message).toContain('Detección de red en tiempo real habilitada');
    expect(message).toContain('actualiza automáticamente');
  });

  it('should return Firefox-specific message when browser is Firefox', () => {
    vi.spyOn(networkFallback, 'parseBrowserInfo').mockReturnValue({
      browser: 'firefox',
      mobile: false,
      os: 'windows',
    });

    const message = getBrowserSupportMessage(false);
    expect(message).toContain('Firefox no soporta');
    expect(message).toContain('análisis de velocidad');
  });

  it('should return Safari-specific message when browser is Safari', () => {
    vi.spyOn(networkFallback, 'parseBrowserInfo').mockReturnValue({
      browser: 'safari',
      mobile: false,
      os: 'macos',
    });

    const message = getBrowserSupportMessage(false);
    expect(message).toContain('Safari no soporta');
    expect(message).toContain('motivos de privacidad');
  });

  it('should return generic fallback message for unknown browsers', () => {
    vi.spyOn(networkFallback, 'parseBrowserInfo').mockReturnValue({
      browser: 'unknown',
      mobile: false,
      os: 'linux',
    });

    const message = getBrowserSupportMessage(false);
    expect(message).toContain('Tu navegador no soporta');
    expect(message).toContain('detección automática de red');
  });
});

describe('tooltip functionality', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render info icon and tooltip elements', () => {
    const indicator = createConnectionIndicator(container);

    const infoIcon = container.querySelector('.connection-indicator__info');
    expect(infoIcon).toBeTruthy();
    expect(infoIcon.getAttribute('role')).toBe('button');
    expect(infoIcon.getAttribute('tabindex')).toBe('0');
    expect(infoIcon.querySelector('svg')).toBeTruthy();

    const tooltip = container.querySelector('.connection-indicator__tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(tooltip.style.display).toBe('none');

    indicator.destroy();
  });

  it('should update tooltip content when connection info changes', () => {
    vi.spyOn(networkFallback, 'parseBrowserInfo').mockReturnValue({
      browser: 'chrome',
      mobile: false,
      os: 'windows',
    });

    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const tooltip = container.querySelector('.connection-indicator__tooltip');
    expect(tooltip.textContent).toContain('Detección de red en tiempo real habilitada');

    indicator.destroy();
  });

  it('should show different tooltip message for unsupported browsers', () => {
    vi.spyOn(networkFallback, 'parseBrowserInfo').mockReturnValue({
      browser: 'firefox',
      mobile: false,
      os: 'linux',
    });

    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: false,
      type: null,
      effectiveType: null,
      downlink: null,
      rtt: null,
    });

    const tooltip = container.querySelector('.connection-indicator__tooltip');
    expect(tooltip.textContent).toContain('Firefox no soporta');

    indicator.destroy();
  });

  it('should show tooltip when info icon is clicked', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const infoIcon = container.querySelector('.connection-indicator__info');
    const tooltip = container.querySelector('.connection-indicator__tooltip');

    expect(tooltip.style.display).toBe('none');

    infoIcon.click();

    expect(tooltip.style.display).toBe('block');
    expect(infoIcon.getAttribute('aria-expanded')).toBe('true');

    indicator.destroy();
  });

  it('should hide tooltip when info icon is clicked again', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const infoIcon = container.querySelector('.connection-indicator__info');
    const tooltip = container.querySelector('.connection-indicator__tooltip');

    infoIcon.click();
    expect(tooltip.style.display).toBe('block');

    infoIcon.click();
    expect(tooltip.style.display).toBe('none');
    expect(infoIcon.getAttribute('aria-expanded')).toBe('false');

    indicator.destroy();
  });

  it('should show tooltip when Enter key is pressed on info icon', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const infoIcon = container.querySelector('.connection-indicator__info');
    const tooltip = container.querySelector('.connection-indicator__tooltip');

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    infoIcon.dispatchEvent(event);

    expect(tooltip.style.display).toBe('block');

    indicator.destroy();
  });

  it('should show tooltip when Space key is pressed on info icon', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const infoIcon = container.querySelector('.connection-indicator__info');
    const tooltip = container.querySelector('.connection-indicator__tooltip');

    const event = new KeyboardEvent('keydown', { key: ' ' });
    infoIcon.dispatchEvent(event);

    expect(tooltip.style.display).toBe('block');

    indicator.destroy();
  });

  it('should hide tooltip when clicking outside the indicator', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const infoIcon = container.querySelector('.connection-indicator__info');
    const tooltip = container.querySelector('.connection-indicator__tooltip');

    // Show tooltip
    infoIcon.click();
    expect(tooltip.style.display).toBe('block');

    // Click outside
    document.body.click();
    expect(tooltip.style.display).toBe('none');

    indicator.destroy();
  });

  it('should not hide tooltip when clicking inside the indicator', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const infoIcon = container.querySelector('.connection-indicator__info');
    const tooltip = container.querySelector('.connection-indicator__tooltip');
    const root = container.querySelector('.connection-indicator');

    // Show tooltip
    infoIcon.click();
    expect(tooltip.style.display).toBe('block');

    // Click inside the indicator (but not on info icon)
    root.click();
    expect(tooltip.style.display).toBe('block');

    indicator.destroy();
  });

  it('should hide tooltip when indicator is destroyed', () => {
    const indicator = createConnectionIndicator(container);

    indicator.update({
      supported: true,
      type: 'wifi',
      effectiveType: null,
      downlink: 50,
      rtt: 20,
    });

    const infoIcon = container.querySelector('.connection-indicator__info');
    infoIcon.click();

    const tooltip = container.querySelector('.connection-indicator__tooltip');
    expect(tooltip.style.display).toBe('block');

    indicator.destroy();

    // Indicator and tooltip should be removed from DOM
    const tooltipAfterDestroy = container.querySelector('.connection-indicator__tooltip');
    expect(tooltipAfterDestroy).toBeNull();
  });
});
