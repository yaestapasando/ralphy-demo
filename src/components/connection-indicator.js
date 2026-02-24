/**
 * ConnectionIndicator — UI component for displaying network connection type.
 *
 * Renders an icon and label showing the current connection type (Wi-Fi,
 * cellular, ethernet, etc.) in the app header. Updates in real-time when
 * the connection changes. Includes a tooltip explaining browser support
 * limitations.
 */

import { onConnectionChange } from '../services/network-detection.js';
import { parseBrowserInfo } from '../services/network-fallback.js';

/**
 * Connection type display configuration.
 * Maps connection types to human-readable labels and icon identifiers.
 */
const CONNECTION_CONFIG = {
  wifi: {
    label: 'Wi-Fi',
    icon: 'wifi',
    ariaLabel: 'Conectado a Wi-Fi',
  },
  cellular: {
    label: 'Datos móviles',
    icon: 'cellular',
    ariaLabel: 'Conectado a red móvil',
  },
  ethernet: {
    label: 'Ethernet',
    icon: 'ethernet',
    ariaLabel: 'Conectado a Ethernet',
  },
  bluetooth: {
    label: 'Bluetooth',
    icon: 'bluetooth',
    ariaLabel: 'Conectado vía Bluetooth',
  },
  '4g': {
    label: '4G',
    icon: 'cellular',
    ariaLabel: 'Conectado a red 4G',
  },
  '3g': {
    label: '3G',
    icon: 'cellular',
    ariaLabel: 'Conectado a red 3G',
  },
  '2g': {
    label: '2G',
    icon: 'cellular',
    ariaLabel: 'Conectado a red 2G',
  },
  'slow-2g': {
    label: '2G lenta',
    icon: 'cellular',
    ariaLabel: 'Conectado a red 2G lenta',
  },
  unknown: {
    label: 'Desconocida',
    icon: 'unknown',
    ariaLabel: 'Tipo de conexión desconocida',
  },
  none: {
    label: 'Sin conexión',
    icon: 'offline',
    ariaLabel: 'Sin conexión a internet',
  },
};

/**
 * SVG icons for each connection type.
 */
const ICONS = {
  wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
    <line x1="12" y1="20" x2="12.01" y2="20"></line>
  </svg>`,
  cellular: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="18" y="10" width="4" height="11" rx="1"></rect>
    <rect x="12" y="6" width="4" height="15" rx="1"></rect>
    <rect x="6" y="14" width="4" height="7" rx="1"></rect>
    <rect x="0" y="18" width="4" height="3" rx="1"></rect>
  </svg>`,
  ethernet: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <line x1="7" y1="12" x2="17" y2="12"></line>
    <line x1="7" y1="8" x2="17" y2="8"></line>
    <line x1="7" y1="16" x2="17" y2="16"></line>
  </svg>`,
  bluetooth: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
  </svg>`,
  unknown: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>`,
  offline: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"></line>
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
    <line x1="12" y1="20" x2="12.01" y2="20"></line>
  </svg>`,
};

/**
 * Determines the display type based on connection info.
 * Prioritizes effectiveType for cellular connections, falls back to type.
 *
 * @param {object} connectionInfo - Connection info from network detection.
 * @returns {string} Connection type key for display config.
 */
export function determineDisplayType(connectionInfo) {
  // If connection type is 'none', show offline
  if (connectionInfo.type === 'none') {
    return 'none';
  }

  // For cellular, prefer effectiveType if available
  if (connectionInfo.type === 'cellular' && connectionInfo.effectiveType) {
    const effectiveType = connectionInfo.effectiveType;
    if (CONNECTION_CONFIG[effectiveType]) {
      return effectiveType;
    }
    return 'cellular';
  }

  // For other types, use the type directly
  if (connectionInfo.type && CONNECTION_CONFIG[connectionInfo.type]) {
    return connectionInfo.type;
  }

  // If not supported or unknown, return 'unknown'
  return 'unknown';
}

/**
 * Gets the browser support message based on browser info and API support.
 *
 * @param {boolean} isSupported - Whether Network Information API is supported.
 * @returns {string} Tooltip message explaining support status.
 */
export function getBrowserSupportMessage(isSupported) {
  const browserInfo = parseBrowserInfo();

  if (isSupported) {
    return 'Detección de red en tiempo real habilitada. El tipo de conexión se actualiza automáticamente cuando cambias de red.';
  }

  // Browser-specific messages for unsupported browsers
  if (browserInfo.browser === 'firefox') {
    return 'Firefox no soporta la API de detección de red. El tipo de conexión se detectará mediante análisis de velocidad después de ejecutar un test.';
  }

  if (browserInfo.browser === 'safari') {
    return 'Safari no soporta la API de detección de red por motivos de privacidad. El tipo de conexión se detectará mediante análisis de velocidad después de ejecutar un test.';
  }

  // Generic fallback message
  return 'Tu navegador no soporta la detección automática de red. El tipo de conexión se detectará mediante análisis de velocidad después de ejecutar un test.';
}

/**
 * Creates and manages the connection indicator component.
 *
 * @param {HTMLElement} container - DOM element to render the indicator into.
 * @returns {{ update(info: object): void, destroy(): void }}
 */
export function createConnectionIndicator(container) {
  const root = document.createElement('div');
  root.className = 'connection-indicator';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');

  const iconContainer = document.createElement('span');
  iconContainer.className = 'connection-indicator__icon';
  iconContainer.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'connection-indicator__label';

  // Info icon for tooltip
  const infoIcon = document.createElement('span');
  infoIcon.className = 'connection-indicator__info';
  infoIcon.setAttribute('aria-label', 'Información sobre detección de red');
  infoIcon.setAttribute('role', 'button');
  infoIcon.setAttribute('tabindex', '0');
  infoIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>`;

  // Tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'connection-indicator__tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.style.display = 'none';

  root.appendChild(iconContainer);
  root.appendChild(label);
  root.appendChild(infoIcon);
  root.appendChild(tooltip);
  container.appendChild(root);

  /**
   * Updates the indicator with new connection information.
   * @param {object} connectionInfo - Connection info from network detection.
   */
  function update(connectionInfo) {
    const displayType = determineDisplayType(connectionInfo);
    const config = CONNECTION_CONFIG[displayType] || CONNECTION_CONFIG.unknown;
    const icon = ICONS[config.icon] || ICONS.unknown;

    iconContainer.innerHTML = icon;
    label.textContent = config.label;
    root.setAttribute('aria-label', config.ariaLabel);

    // Update CSS class for styling
    root.className = `connection-indicator connection-indicator--${displayType}`;

    // Update tooltip content based on API support
    const tooltipMessage = getBrowserSupportMessage(connectionInfo.supported);
    tooltip.textContent = tooltipMessage;
  }

  /**
   * Shows the tooltip.
   */
  function showTooltip() {
    tooltip.style.display = 'block';
    infoIcon.setAttribute('aria-expanded', 'true');
  }

  /**
   * Hides the tooltip.
   */
  function hideTooltip() {
    tooltip.style.display = 'none';
    infoIcon.setAttribute('aria-expanded', 'false');
  }

  /**
   * Toggles the tooltip visibility.
   */
  function toggleTooltip() {
    if (tooltip.style.display === 'none') {
      showTooltip();
    } else {
      hideTooltip();
    }
  }

  // Tooltip interaction handlers
  infoIcon.addEventListener('click', toggleTooltip);
  infoIcon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTooltip();
    }
  });

  // Close tooltip when clicking outside
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      hideTooltip();
    }
  });

  /**
   * Subscribes to connection changes and updates the indicator automatically.
   * @returns {() => void} Unsubscribe function.
   */
  function subscribe() {
    return onConnectionChange((info) => {
      update(info);
    });
  }

  /** Removes the indicator from the DOM and cleans up listeners. */
  function destroy() {
    hideTooltip();
    root.remove();
  }

  return { update, subscribe, destroy };
}
