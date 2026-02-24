/**
 * Speed Chart Component
 * Displays a line chart showing the evolution of download and upload speeds over time
 */

import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend, Filler);

/**
 * Metric configuration for different chart types
 */
const METRICS = {
  download: {
    label: 'Descarga',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    dataKey: 'download_mbps',
    unit: 'Mbps',
    yAxisLabel: 'Velocidad (Mbps)'
  },
  upload: {
    label: 'Subida',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    dataKey: 'upload_mbps',
    unit: 'Mbps',
    yAxisLabel: 'Velocidad (Mbps)'
  },
  ping: {
    label: 'Ping',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    dataKey: 'ping_ms',
    unit: 'ms',
    yAxisLabel: 'Latencia (ms)'
  }
};

/**
 * Prepare chart data from speed test results
 * @param {Array} results - Speed test results sorted by timestamp
 * @param {string} metric - Metric to display ('download', 'upload', or 'ping')
 * @returns {Object} Chart.js data object
 */
function prepareChartData(results, metric = 'download') {
  const sortedResults = [...results].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const metricConfig = METRICS[metric];

  const labels = sortedResults.map(r => new Date(r.timestamp));
  const data = sortedResults.map(r => r[metricConfig.dataKey]);

  return {
    labels,
    datasets: [
      {
        label: metricConfig.label,
        data,
        borderColor: metricConfig.color,
        backgroundColor: metricConfig.bgColor,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: metricConfig.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true
      }
    ]
  };
}

/**
 * Get chart configuration
 * @param {Object} data - Chart data
 * @param {string} metric - Current metric being displayed
 * @returns {Object} Chart.js configuration object
 */
function getChartConfig(data, metric = 'download') {
  const metricConfig = METRICS[metric];

  return {
    type: 'line',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: 'Evolución de Velocidad de Internet',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            title: (tooltipItems) => {
              const date = new Date(tooltipItems[0].parsed.x);
              return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            },
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value.toFixed(2)} ${metricConfig.unit}`;
            }
          }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 13
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'dd/MM/yyyy',
              hour: 'HH:mm',
              minute: 'HH:mm'
            },
            tooltipFormat: 'dd/MM/yyyy HH:mm'
          },
          title: {
            display: true,
            text: 'Fecha',
            font: {
              size: 13,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: metricConfig.yAxisLabel,
            font: {
              size: 13,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  };
}

/**
 * Create metric selector UI
 * @param {string} selectedMetric - Currently selected metric
 * @param {Function} onChange - Callback when metric changes
 * @returns {HTMLDivElement} Metric selector element
 */
function createMetricSelector(selectedMetric, onChange) {
  const selector = document.createElement('div');
  selector.className = 'speed-chart__selector';

  const label = document.createElement('label');
  label.className = 'speed-chart__selector-label';
  label.textContent = 'Métrica:';
  label.setAttribute('for', 'metric-selector');

  const select = document.createElement('select');
  select.className = 'speed-chart__selector-select';
  select.id = 'metric-selector';

  Object.entries(METRICS).forEach(([key, config]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = config.label;
    option.selected = key === selectedMetric;
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => {
    onChange(e.target.value);
  });

  selector.appendChild(label);
  selector.appendChild(select);

  return selector;
}

/**
 * Create an empty state for the chart
 * @returns {HTMLDivElement} Empty state element
 */
function createEmptyState() {
  const emptyState = document.createElement('div');
  emptyState.className = 'speed-chart__empty';
  emptyState.innerHTML = `
    <div class="speed-chart__empty-icon">📈</div>
    <p class="speed-chart__empty-title">No hay datos suficientes para mostrar el gráfico</p>
    <p class="speed-chart__empty-text">Realiza más tests para ver la evolución de tu velocidad</p>
  `;
  return emptyState;
}

/**
 * Create and render a speed chart
 * @param {HTMLElement} container - Container element
 * @returns {Object} Chart API
 */
export function createSpeedChart(container) {
  if (!container) {
    throw new Error('Container element is required');
  }

  let chart = null;
  let canvasElement = null;
  let emptyStateElement = null;
  let selectorElement = null;
  let currentMetric = 'download';
  let currentResults = null;

  /**
   * Render the chart with current metric and results
   */
  function renderChart() {
    // Clear chart area (preserve selector if it exists)
    const chartArea = container.querySelector('.speed-chart__chart-area');
    if (chartArea) {
      chartArea.innerHTML = '';
    } else {
      container.innerHTML = '';
    }

    // If no results or less than 2 results, show empty state
    if (!currentResults || currentResults.length < 2) {
      emptyStateElement = createEmptyState();
      if (chartArea) {
        chartArea.appendChild(emptyStateElement);
      } else {
        container.appendChild(emptyStateElement);
      }

      // Destroy existing chart if any
      if (chart) {
        chart.destroy();
        chart = null;
      }
      return;
    }

    // Create selector if it doesn't exist
    if (!selectorElement) {
      selectorElement = createMetricSelector(currentMetric, (newMetric) => {
        currentMetric = newMetric;
        renderChart();
      });
      container.insertBefore(selectorElement, container.firstChild);
    }

    // Get or create chart area
    let renderChartArea = container.querySelector('.speed-chart__chart-area');
    if (!renderChartArea) {
      renderChartArea = document.createElement('div');
      renderChartArea.className = 'speed-chart__chart-area';
      container.appendChild(renderChartArea);
    }

    // Create canvas element if it doesn't exist
    if (!canvasElement || !canvasElement.isConnected) {
      canvasElement = document.createElement('canvas');
      canvasElement.className = 'speed-chart__canvas';
      renderChartArea.appendChild(canvasElement);
    }

    // Get chart data and config
    const data = prepareChartData(currentResults, currentMetric);
    const config = getChartConfig(data, currentMetric);

    // Destroy existing chart if any
    if (chart) {
      chart.destroy();
    }

    // Create new chart
    chart = new Chart(canvasElement, config);
  }

  /**
   * Update the chart with new results
   * @param {Array} results - Speed test results
   */
  function update(results) {
    currentResults = results;
    renderChart();
  }

  /**
   * Change the displayed metric
   * @param {string} metric - Metric to display ('download', 'upload', or 'ping')
   */
  function setMetric(metric) {
    if (!METRICS[metric]) {
      throw new Error(`Invalid metric: ${metric}`);
    }
    currentMetric = metric;
    renderChart();
  }

  /**
   * Get the current metric
   * @returns {string} Current metric
   */
  function getMetric() {
    return currentMetric;
  }

  /**
   * Destroy the chart and clean up
   */
  function destroy() {
    if (chart) {
      chart.destroy();
      chart = null;
    }
    if (canvasElement) {
      canvasElement.remove();
      canvasElement = null;
    }
    if (emptyStateElement) {
      emptyStateElement.remove();
      emptyStateElement = null;
    }
    if (selectorElement) {
      selectorElement.remove();
      selectorElement = null;
    }
    currentResults = null;
  }

  /**
   * Get the underlying Chart.js instance
   * @returns {Chart|null} Chart.js instance
   */
  function getChart() {
    return chart;
  }

  // Public API
  return {
    update,
    destroy,
    getChart,
    setMetric,
    getMetric
  };
}
