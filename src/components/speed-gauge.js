/**
 * SpeedGauge — Animated SVG gauge for real-time speed display.
 *
 * Renders a semicircular arc gauge that smoothly animates between values.
 * Used to visualise download/upload speed (Mbps) and ping (ms) during
 * a speed test.
 */

/** SVG namespace. */
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Default configuration. */
const DEFAULTS = {
  /** Minimum gauge value. */
  min: 0,
  /** Maximum gauge value (auto-scales if exceeded). */
  max: 100,
  /** Current value to display. */
  value: 0,
  /** Unit label shown below the value. */
  unit: 'Mbps',
  /** Label shown at the bottom of the gauge. */
  label: '',
  /** Animation duration in milliseconds. */
  animationDuration: 600,
  /** Gauge arc start angle in degrees (0 = top, clockwise). */
  startAngle: -225,
  /** Gauge arc end angle in degrees. */
  endAngle: 45,
  /** Radius of the gauge arc. */
  radius: 90,
  /** Stroke width of the gauge arc. */
  strokeWidth: 12,
  /** Color of the background (track) arc. */
  trackColor: '#e5e7eb',
  /** Color of the filled arc (or array for gradient stops). */
  fillColor: '#3b82f6',
};

/**
 * Converts degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Computes a point on a circle given center, radius, and angle.
 * @param {number} cx - Center X.
 * @param {number} cy - Center Y.
 * @param {number} r - Radius.
 * @param {number} angleDeg - Angle in degrees (0 = 3 o'clock, clockwise).
 * @returns {{ x: number, y: number }}
 */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Builds an SVG arc path descriptor.
 * @param {number} cx - Center X.
 * @param {number} cy - Center Y.
 * @param {number} r - Radius.
 * @param {number} startDeg - Start angle (degrees).
 * @param {number} endDeg - End angle (degrees).
 * @returns {string} SVG path `d` attribute value.
 */
function describeArc(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const sweep = endDeg - startDeg;
  const largeArc = sweep > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/**
 * Creates an SVG element with attributes.
 * @param {string} tag - SVG element tag name.
 * @param {Record<string, string>} attrs - Attribute key/value pairs.
 * @returns {SVGElement}
 */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

/**
 * Creates and manages an animated speed gauge.
 *
 * @param {HTMLElement} container - DOM element to render the gauge into.
 * @param {Partial<typeof DEFAULTS>} [options] - Configuration overrides.
 * @returns {{ setValue(n: number): void, setLabel(s: string): void, setPhase(s: string): void, destroy(): void }}
 */
export function createSpeedGauge(container, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const { radius, strokeWidth, startAngle, endAngle, trackColor, fillColor, animationDuration } = config;

  const size = (radius + strokeWidth) * 2;
  const cx = size / 2;
  const cy = size / 2;

  // State
  let currentValue = 0;
  let displayValue = 0;
  let targetValue = 0;
  let animationStart = null;
  let animationId = null;

  // Build SVG
  const svg = svgEl('svg', {
    viewBox: `0 0 ${size} ${size}`,
    class: 'speed-gauge',
    role: 'meter',
    'aria-valuemin': String(config.min),
    'aria-valuemax': String(config.max),
    'aria-valuenow': String(config.value),
    'aria-label': config.label || 'Speed gauge',
  });

  // Background track arc
  const trackPath = svgEl('path', {
    d: describeArc(cx, cy, radius, startAngle, endAngle),
    fill: 'none',
    stroke: trackColor,
    'stroke-width': String(strokeWidth),
    'stroke-linecap': 'round',
    class: 'speed-gauge__track',
  });

  // Filled arc (animated)
  const fillPath = svgEl('path', {
    d: describeArc(cx, cy, radius, startAngle, startAngle),
    fill: 'none',
    stroke: fillColor,
    'stroke-width': String(strokeWidth),
    'stroke-linecap': 'round',
    class: 'speed-gauge__fill',
  });

  // Value text (centered)
  const valueText = svgEl('text', {
    x: String(cx),
    y: String(cy - 8),
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    class: 'speed-gauge__value',
    'font-size': '32',
    'font-weight': '700',
    fill: '#1f2937',
  });
  valueText.textContent = '0';

  // Unit label
  const unitText = svgEl('text', {
    x: String(cx),
    y: String(cy + 22),
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    class: 'speed-gauge__unit',
    'font-size': '14',
    fill: '#6b7280',
  });
  unitText.textContent = config.unit;

  // Phase label (e.g. "Descarga", "Subida", "Ping")
  const phaseText = svgEl('text', {
    x: String(cx),
    y: String(cy + 48),
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    class: 'speed-gauge__phase',
    'font-size': '13',
    fill: '#9ca3af',
  });
  phaseText.textContent = config.label;

  svg.appendChild(trackPath);
  svg.appendChild(fillPath);
  svg.appendChild(valueText);
  svg.appendChild(unitText);
  svg.appendChild(phaseText);
  container.appendChild(svg);

  /**
   * Easing function: ease-out cubic.
   * @param {number} t - Progress 0..1.
   * @returns {number}
   */
  function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
  }

  /**
   * Updates the arc fill and text to reflect the current display value.
   * @param {number} val
   */
  function render(val) {
    const clamped = Math.max(config.min, Math.min(val, config.max));
    const ratio = (clamped - config.min) / (config.max - config.min || 1);
    const angleSweep = endAngle - startAngle;
    const currentEnd = startAngle + ratio * angleSweep;

    if (ratio <= 0) {
      fillPath.setAttribute('d', describeArc(cx, cy, radius, startAngle, startAngle + 0.01));
      fillPath.setAttribute('opacity', '0');
    } else {
      fillPath.setAttribute('d', describeArc(cx, cy, radius, startAngle, currentEnd));
      fillPath.setAttribute('opacity', '1');
    }

    valueText.textContent = val < 10 ? val.toFixed(1) : Math.round(val).toString();

    svg.setAttribute('aria-valuenow', String(Math.round(val * 100) / 100));
  }

  /**
   * Animation frame callback.
   * @param {DOMHighResTimeStamp} timestamp
   */
  function animate(timestamp) {
    if (animationStart === null) animationStart = timestamp;
    const elapsed = timestamp - animationStart;
    const progress = Math.min(elapsed / animationDuration, 1);
    const eased = easeOutCubic(progress);

    displayValue = currentValue + (targetValue - currentValue) * eased;
    render(displayValue);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      currentValue = targetValue;
      displayValue = targetValue;
      animationId = null;
      animationStart = null;
    }
  }

  /**
   * Sets the gauge to a new value with smooth animation.
   * @param {number} value
   */
  function setValue(value) {
    targetValue = Math.max(config.min, value);
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      currentValue = displayValue;
    }
    animationStart = null;
    animationId = requestAnimationFrame(animate);
  }

  /**
   * Updates the label at the bottom of the gauge.
   * @param {string} label
   */
  function setLabel(label) {
    phaseText.textContent = label;
  }

  /**
   * Updates the phase text and optionally the unit.
   * @param {string} phase - Display text for the current test phase.
   * @param {string} [unit] - Unit label override.
   */
  function setPhase(phase, unit) {
    phaseText.textContent = phase;
    if (unit !== undefined) {
      unitText.textContent = unit;
    }
  }

  /** Cleans up the gauge and cancels pending animations. */
  function destroy() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    svg.remove();
  }

  // Initial render
  render(config.value);
  if (config.value > 0) {
    setValue(config.value);
  }

  return { setValue, setLabel, setPhase, destroy };
}

export { describeArc, polarToCartesian, degToRad, DEFAULTS };
