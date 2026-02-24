/**
 * Unit tests for ConnectionIndicator component.
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createConnectionIndicator,
  determineDisplayType,
} from '../src/components/connection-indicator.js';
import * as networkDetection from '../src/services/network-detection.js';

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
