import { describe, it, expect, vi } from 'vitest';
import {
  SpeedTestError,
  ErrorCode,
  classifyError,
  assertResponseOk,
  isTimeoutError,
} from '../src/services/errors.js';

// ---------------------------------------------------------------------------
// ErrorCode – constant verification
// ---------------------------------------------------------------------------

describe('ErrorCode', () => {
  it('contains all expected error codes', () => {
    expect(ErrorCode.TIMEOUT).toBe('TIMEOUT');
    expect(ErrorCode.OFFLINE).toBe('OFFLINE');
    expect(ErrorCode.SERVER_UNAVAILABLE).toBe('SERVER_UNAVAILABLE');
    expect(ErrorCode.ABORTED).toBe('ABORTED');
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
  });
});

// ---------------------------------------------------------------------------
// SpeedTestError – custom error class
// ---------------------------------------------------------------------------

describe('SpeedTestError', () => {
  it('creates an error with code and default message', () => {
    const err = new SpeedTestError(ErrorCode.TIMEOUT);
    expect(err.name).toBe('SpeedTestError');
    expect(err.code).toBe('TIMEOUT');
    expect(err.message).toMatch(/tiempo de espera/);
    expect(err).toBeInstanceOf(Error);
  });

  it('allows a custom message', () => {
    const err = new SpeedTestError(ErrorCode.NETWORK_ERROR, 'Custom message');
    expect(err.message).toBe('Custom message');
    expect(err.code).toBe('NETWORK_ERROR');
  });

  it('stores the cause and phase', () => {
    const cause = new Error('original');
    const err = new SpeedTestError(ErrorCode.OFFLINE, undefined, {
      cause,
      phase: 'download',
    });
    expect(err.cause).toBe(cause);
    expect(err.phase).toBe('download');
  });

  it('defaults to unknown message for unrecognized code', () => {
    const err = new SpeedTestError('UNKNOWN_CODE');
    expect(err.message).toBe('Error desconocido.');
  });

  it('uses default messages for each error code', () => {
    expect(new SpeedTestError(ErrorCode.OFFLINE).message).toMatch(/conexión a internet/);
    expect(new SpeedTestError(ErrorCode.SERVER_UNAVAILABLE).message).toMatch(/servidor/);
    expect(new SpeedTestError(ErrorCode.ABORTED).message).toMatch(/cancelada/);
    expect(new SpeedTestError(ErrorCode.NETWORK_ERROR).message).toMatch(/Error de red/);
  });
});

// ---------------------------------------------------------------------------
// classifyError
// ---------------------------------------------------------------------------

describe('classifyError', () => {
  it('classifies AbortError as ABORTED', () => {
    const abort = new DOMException('Aborted', 'AbortError');
    const result = classifyError(abort);
    expect(result).toBeInstanceOf(SpeedTestError);
    expect(result.code).toBe(ErrorCode.ABORTED);
    expect(result.cause).toBe(abort);
  });

  it('classifies TypeError as NETWORK_ERROR when online', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const typeErr = new TypeError('Failed to fetch');
    const result = classifyError(typeErr);
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
    vi.unstubAllGlobals();
  });

  it('classifies TypeError as OFFLINE when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { onLine: false });
    const typeErr = new TypeError('Failed to fetch');
    const result = classifyError(typeErr, 'ping');
    expect(result.code).toBe(ErrorCode.OFFLINE);
    expect(result.phase).toBe('ping');
    vi.unstubAllGlobals();
  });

  it('passes through SpeedTestError and sets phase if missing', () => {
    const original = new SpeedTestError(ErrorCode.TIMEOUT);
    const result = classifyError(original, 'upload');
    expect(result).toBe(original);
    expect(result.phase).toBe('upload');
  });

  it('does not overwrite existing phase on SpeedTestError', () => {
    const original = new SpeedTestError(ErrorCode.TIMEOUT, undefined, { phase: 'ping' });
    const result = classifyError(original, 'upload');
    expect(result.phase).toBe('ping');
  });

  it('classifies generic errors as NETWORK_ERROR', () => {
    const generic = new Error('Something went wrong');
    const result = classifyError(generic, 'download');
    expect(result.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(result.cause).toBe(generic);
    expect(result.phase).toBe('download');
  });
});

// ---------------------------------------------------------------------------
// assertResponseOk
// ---------------------------------------------------------------------------

describe('assertResponseOk', () => {
  it('does not throw for ok responses', () => {
    const response = { ok: true, status: 200 };
    expect(() => assertResponseOk(response)).not.toThrow();
  });

  it('throws SERVER_UNAVAILABLE for 500 status', () => {
    const response = { ok: false, status: 500, statusText: 'Internal Server Error' };
    expect(() => assertResponseOk(response, 'download')).toThrow(SpeedTestError);
    try {
      assertResponseOk(response, 'download');
    } catch (err) {
      expect(err.code).toBe(ErrorCode.SERVER_UNAVAILABLE);
      expect(err.phase).toBe('download');
    }
  });

  it('throws SERVER_UNAVAILABLE for 503 status', () => {
    const response = { ok: false, status: 503, statusText: 'Service Unavailable' };
    try {
      assertResponseOk(response);
    } catch (err) {
      expect(err.code).toBe(ErrorCode.SERVER_UNAVAILABLE);
    }
  });

  it('throws NETWORK_ERROR for 4xx status', () => {
    const response = { ok: false, status: 404, statusText: 'Not Found' };
    try {
      assertResponseOk(response, 'ping');
    } catch (err) {
      expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(err.message).toMatch(/HTTP 404/);
    }
  });

  it('handles missing statusText', () => {
    const response = { ok: false, status: 429, statusText: '' };
    try {
      assertResponseOk(response);
    } catch (err) {
      expect(err.message).toMatch(/HTTP 429/);
    }
  });
});

// ---------------------------------------------------------------------------
// isTimeoutError
// ---------------------------------------------------------------------------

describe('isTimeoutError', () => {
  it('returns true for AbortError without external signal', () => {
    const err = new DOMException('Aborted', 'AbortError');
    expect(isTimeoutError(err)).toBe(true);
  });

  it('returns true for AbortError with non-aborted external signal', () => {
    const controller = new AbortController();
    const err = new DOMException('Aborted', 'AbortError');
    expect(isTimeoutError(err, controller.signal)).toBe(true);
  });

  it('returns false for AbortError when external signal is aborted', () => {
    const controller = new AbortController();
    controller.abort();
    const err = new DOMException('Aborted', 'AbortError');
    expect(isTimeoutError(err, controller.signal)).toBe(false);
  });

  it('returns false for non-AbortError', () => {
    const err = new Error('Something else');
    expect(isTimeoutError(err)).toBe(false);
  });
});
