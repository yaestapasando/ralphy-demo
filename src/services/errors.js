/**
 * Error types and classification for speed test network errors.
 *
 * Distinguishes between timeout, offline, server-unavailable, and
 * generic network errors so the UI can display targeted messages.
 */

/** Enumeration of error codes used throughout the speed test. */
export const ErrorCode = {
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  ABORTED: 'ABORTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
};

/** Human-readable messages (Spanish) for each error code. */
const ERROR_MESSAGES = {
  [ErrorCode.TIMEOUT]: 'La prueba ha excedido el tiempo de espera. Inténtalo de nuevo.',
  [ErrorCode.OFFLINE]: 'No hay conexión a internet. Verifica tu red e inténtalo de nuevo.',
  [ErrorCode.SERVER_UNAVAILABLE]: 'El servidor de pruebas no está disponible. Inténtalo más tarde.',
  [ErrorCode.ABORTED]: 'La prueba fue cancelada.',
  [ErrorCode.NETWORK_ERROR]: 'Error de red. Verifica tu conexión e inténtalo de nuevo.',
};

/**
 * Custom error class for speed test failures.
 *
 * Carries a `code` property from {@link ErrorCode} so callers can
 * switch on the error type without parsing message strings.
 */
export class SpeedTestError extends Error {
  /**
   * @param {string} code - One of {@link ErrorCode}.
   * @param {string} [message] - Override the default message.
   * @param {object} [options]
   * @param {Error} [options.cause] - Original error for chaining.
   * @param {string} [options.phase] - Which phase failed ('ping', 'download', 'upload').
   */
  constructor(code, message, { cause, phase } = {}) {
    super(message || ERROR_MESSAGES[code] || 'Error desconocido.');
    this.name = 'SpeedTestError';
    this.code = code;
    if (cause) this.cause = cause;
    if (phase) this.phase = phase;
  }
}

/**
 * Classifies a raw error into a {@link SpeedTestError}.
 *
 * @param {Error} error - The original error from fetch or AbortController.
 * @param {string} [phase] - Current measurement phase.
 * @returns {SpeedTestError}
 */
export function classifyError(error, phase) {
  // User- or signal-initiated abort.
  if (error.name === 'AbortError') {
    return new SpeedTestError(ErrorCode.ABORTED, undefined, { cause: error, phase });
  }

  // TypeError from fetch usually means a network-level failure.
  if (error instanceof TypeError) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return new SpeedTestError(ErrorCode.OFFLINE, undefined, { cause: error, phase });
    }
    return new SpeedTestError(ErrorCode.NETWORK_ERROR, undefined, { cause: error, phase });
  }

  // Errors created by our own timeout/server checks (see below).
  if (error instanceof SpeedTestError) {
    if (phase && !error.phase) error.phase = phase;
    return error;
  }

  return new SpeedTestError(ErrorCode.NETWORK_ERROR, undefined, { cause: error, phase });
}

/**
 * Checks an HTTP response for error status codes and throws a
 * {@link SpeedTestError} for non-OK responses.
 *
 * @param {Response} response - The fetch Response object.
 * @param {string} [phase] - Current measurement phase.
 * @throws {SpeedTestError} If the response status indicates a server error.
 */
export function assertResponseOk(response, phase) {
  if (response.ok) return;

  if (response.status >= 500) {
    throw new SpeedTestError(ErrorCode.SERVER_UNAVAILABLE, undefined, { phase });
  }

  throw new SpeedTestError(
    ErrorCode.NETWORK_ERROR,
    `HTTP ${response.status}: ${response.statusText || 'Error'}`,
    { phase },
  );
}

/**
 * Determines whether a fetch error is a timeout.
 *
 * When an AbortController fires due to our setTimeout-based timeout
 * (and NOT from an external signal), the error is a timeout.
 *
 * @param {Error} error
 * @param {AbortSignal} [externalSignal] - The caller's signal (not the timeout's).
 * @returns {boolean}
 */
export function isTimeoutError(error, externalSignal) {
  return error.name === 'AbortError' && !externalSignal?.aborted;
}
