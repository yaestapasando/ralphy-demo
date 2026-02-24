/**
 * Speed Chart Component
 * Displays a line chart showing the evolution of download and upload speeds over time
 */

import { Chart, LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Title, Tooltip, Legend, Filler);

/**
 * Prepare chart data from speed test results
 * @param {Array} results - Speed test results sorted by timestamp
 * @returns {Object} Chart.js data object
 */
function prepareChartData(results) {
  const sortedResults = [...results].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const labels = sortedResults.map(r => new Date(r.timestamp));
  const downloadData = sortedResults.map(r => r.download_mbps);
  const uploadData = sortedResults.map(r => r.upload_mbps);

  return {
    labels,
    datasets: [
      {
        label: 'Descarga',
        data: downloadData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Subida',
        data: uploadData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
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
 * @returns {Object} Chart.js configuration object
 */
function getChartConfig(data) {
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
              return `${label}: ${value.toFixed(2)} Mbps`;
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
            text: 'Velocidad (Mbps)',
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

  /**
   * Update the chart with new results
   * @param {Array} results - Speed test results
   */
  function update(results) {
    // Clear container
    container.innerHTML = '';

    // If no results or less than 2 results, show empty state
    if (!results || results.length < 2) {
      emptyStateElement = createEmptyState();
      container.appendChild(emptyStateElement);

      // Destroy existing chart if any
      if (chart) {
        chart.destroy();
        chart = null;
      }
      return;
    }

    // Create canvas element if it doesn't exist
    if (!canvasElement || !canvasElement.isConnected) {
      canvasElement = document.createElement('canvas');
      canvasElement.className = 'speed-chart__canvas';
      container.appendChild(canvasElement);
    }

    // Get chart data and config
    const data = prepareChartData(results);
    const config = getChartConfig(data);

    // Destroy existing chart if any
    if (chart) {
      chart.destroy();
    }

    // Create new chart
    chart = new Chart(canvasElement, config);
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
    getChart
  };
}
