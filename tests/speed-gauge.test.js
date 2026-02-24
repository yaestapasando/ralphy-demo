import { describe, it, expect } from 'vitest';
import { describeArc, polarToCartesian, degToRad, DEFAULTS } from '../src/components/speed-gauge.js';

// ---------------------------------------------------------------------------
// degToRad – pure function tests
// ---------------------------------------------------------------------------

describe('degToRad', () => {
  it('converts 0 degrees to 0 radians', () => {
    expect(degToRad(0)).toBe(0);
  });

  it('converts 180 degrees to PI radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
  });

  it('converts 360 degrees to 2*PI radians', () => {
    expect(degToRad(360)).toBeCloseTo(2 * Math.PI, 10);
  });

  it('converts 90 degrees to PI/2 radians', () => {
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('handles negative angles', () => {
    expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2, 10);
  });
});

// ---------------------------------------------------------------------------
// polarToCartesian – pure function tests
// ---------------------------------------------------------------------------

describe('polarToCartesian', () => {
  it('returns point at 0 degrees (3 o\'clock)', () => {
    const p = polarToCartesian(0, 0, 100, 0);
    expect(p.x).toBeCloseTo(100, 5);
    expect(p.y).toBeCloseTo(0, 5);
  });

  it('returns point at 90 degrees (6 o\'clock)', () => {
    const p = polarToCartesian(0, 0, 100, 90);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(100, 5);
  });

  it('returns point at 180 degrees (9 o\'clock)', () => {
    const p = polarToCartesian(0, 0, 100, 180);
    expect(p.x).toBeCloseTo(-100, 5);
    expect(p.y).toBeCloseTo(0, 5);
  });

  it('accounts for center offset', () => {
    const p = polarToCartesian(50, 50, 100, 0);
    expect(p.x).toBeCloseTo(150, 5);
    expect(p.y).toBeCloseTo(50, 5);
  });
});

// ---------------------------------------------------------------------------
// describeArc – SVG path generation
// ---------------------------------------------------------------------------

describe('describeArc', () => {
  it('returns a valid SVG path string', () => {
    const d = describeArc(100, 100, 90, -225, 45);
    expect(d).toMatch(/^M\s/);
    expect(d).toContain('A 90 90');
  });

  it('sets large-arc flag for sweeps > 180 degrees', () => {
    // sweep = 45 - (-225) = 270 > 180 → large-arc = 1
    const d = describeArc(100, 100, 90, -225, 45);
    expect(d).toMatch(/A 90 90 0 1 0/);
  });

  it('clears large-arc flag for sweeps <= 180 degrees', () => {
    const d = describeArc(100, 100, 90, 0, 90);
    expect(d).toMatch(/A 90 90 0 0 0/);
  });

  it('produces different paths for different angles', () => {
    const d1 = describeArc(100, 100, 90, -225, -100);
    const d2 = describeArc(100, 100, 90, -225, 45);
    expect(d1).not.toBe(d2);
  });
});

// ---------------------------------------------------------------------------
// DEFAULTS – configuration sanity
// ---------------------------------------------------------------------------

describe('DEFAULTS', () => {
  it('has expected default values', () => {
    expect(DEFAULTS.min).toBe(0);
    expect(DEFAULTS.max).toBe(100);
    expect(DEFAULTS.value).toBe(0);
    expect(DEFAULTS.unit).toBe('Mbps');
    expect(DEFAULTS.animationDuration).toBe(600);
  });

  it('arc spans 270 degrees by default', () => {
    const sweep = DEFAULTS.endAngle - DEFAULTS.startAngle;
    expect(sweep).toBe(270);
  });
});
