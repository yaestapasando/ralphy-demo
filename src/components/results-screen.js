/**
 * ResultsScreen — Final results display for speed test.
 *
 * Renders a card-based layout showing the four key metrics:
 * download (Mbps), upload (Mbps), ping (ms), and jitter (ms).
 */

/**
 * @typedef {object} SpeedTestResult
 * @property {number} ping - Average latency in ms.
 * @property {number} jitter - Jitter (std dev of latency) in ms.
 * @property {number} download - Download speed in Mbps.
 * @property {number} upload - Upload speed in Mbps.
 */

/**
 * Metric display configuration.
 * @typedef {object} MetricConfig
 * @property {string} key - Property key in SpeedTestResult.
 * @property {string} label - Human-readable label.
 * @property {string} unit - Unit to display.
 * @property {string} icon - CSS class suffix for the icon.
 */

/** Ordered list of metrics to display. */
export const METRICS = [
  { key: 'download', label: 'Descarga',  unit: 'Mbps', icon: 'download' },
  { key: 'upload',   label: 'Subida',    unit: 'Mbps', icon: 'upload' },
  { key: 'ping',     label: 'Ping',      unit: 'ms',   icon: 'ping' },
  { key: 'jitter',   label: 'Jitter',    unit: 'ms',   icon: 'jitter' },
];

/**
 * Formats a numeric value for display.
 * Values >= 10 are shown as integers; values < 10 show one decimal place.
 *
 * @param {number} value
 * @returns {string}
 */
export function formatValue(value) {
  if (value === 0) return '0';
  return value < 10 ? value.toFixed(1) : Math.round(value).toString();
}

/**
 * Extracts display data from a SpeedTestResult according to METRICS order.
 *
 * @param {SpeedTestResult} result
 * @returns {Array<{ label: string, value: string, unit: string, icon: string }>}
 */
export function buildMetricDisplayData(result) {
  return METRICS.map(({ key, label, unit, icon }) => ({
    label,
    value: formatValue(result[key] ?? 0),
    unit,
    icon,
  }));
}

/**
 * Creates and renders the final results screen into a container.
 *
 * @param {HTMLElement} container - DOM element to render into.
 * @param {SpeedTestResult} result - Speed test results to display.
 * @returns {{ update(result: SpeedTestResult): void, destroy(): void }}
 */
export function createResultsScreen(container, result) {
  const root = document.createElement('div');
  root.className = 'results-screen';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Resultados del test de velocidad');

  const title = document.createElement('h2');
  title.className = 'results-screen__title';
  title.textContent = 'Resultados';

  const grid = document.createElement('div');
  grid.className = 'results-screen__grid';

  root.appendChild(title);
  root.appendChild(grid);

  /** @type {Map<string, { valueEl: HTMLElement, unitEl: HTMLElement }>} */
  const cardElements = new Map();

  function renderCards(data) {
    grid.innerHTML = '';
    cardElements.clear();

    for (const metric of data) {
      const card = document.createElement('div');
      card.className = `results-screen__card results-screen__card--${metric.icon}`;

      const labelEl = document.createElement('span');
      labelEl.className = 'results-screen__label';
      labelEl.textContent = metric.label;

      const valueEl = document.createElement('span');
      valueEl.className = 'results-screen__value';
      valueEl.textContent = metric.value;

      const unitEl = document.createElement('span');
      unitEl.className = 'results-screen__unit';
      unitEl.textContent = metric.unit;

      card.appendChild(labelEl);
      card.appendChild(valueEl);
      card.appendChild(unitEl);
      grid.appendChild(card);

      cardElements.set(metric.icon, { valueEl, unitEl });
    }
  }

  renderCards(buildMetricDisplayData(result));
  container.appendChild(root);

  /**
   * Updates displayed values with a new result set.
   * @param {SpeedTestResult} newResult
   */
  function update(newResult) {
    const data = buildMetricDisplayData(newResult);
    for (const metric of data) {
      const els = cardElements.get(metric.icon);
      if (els) {
        els.valueEl.textContent = metric.value;
      }
    }
  }

  /** Removes the results screen from the DOM. */
  function destroy() {
    root.remove();
  }

  return { update, destroy };
}
