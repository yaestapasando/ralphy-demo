import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePing, handleDownload, handleUpload } from '../vite-plugin-test-server.js';
import { EventEmitter } from 'node:events';

/**
 * Creates a mock HTTP response with spies for writeHead, write, end, and once.
 */
function createMockRes() {
  return {
    writeHead: vi.fn(),
    write: vi.fn().mockReturnValue(true),
    end: vi.fn(),
    once: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// handlePing
// ---------------------------------------------------------------------------

describe('handlePing', () => {
  it('responds with 204 and appropriate headers', () => {
    const res = createMockRes();
    handlePing({}, res);

    expect(res.writeHead).toHaveBeenCalledWith(204, {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    expect(res.end).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleDownload
// ---------------------------------------------------------------------------

describe('handleDownload', () => {
  it('sends the default size (1 MB) when no bytes param given', () => {
    const res = createMockRes();
    const url = new URL('http://localhost/download');

    handleDownload({}, res, url);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(1_048_576),
    }));
    expect(res.end).toHaveBeenCalled();
  });

  it('sends the requested number of bytes', () => {
    const res = createMockRes();
    const url = new URL('http://localhost/download?bytes=5000');

    handleDownload({}, res, url);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Length': '5000',
    }));
  });

  it('caps download at 100 MB', () => {
    const res = createMockRes();
    const url = new URL('http://localhost/download?bytes=999999999');

    handleDownload({}, res, url);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Length': String(104_857_600),
    }));
  });

  it('falls back to default for invalid bytes param', () => {
    const res = createMockRes();
    const url = new URL('http://localhost/download?bytes=abc');

    handleDownload({}, res, url);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Length': String(1_048_576),
    }));
  });

  it('falls back to default for negative bytes param', () => {
    const res = createMockRes();
    const url = new URL('http://localhost/download?bytes=-100');

    handleDownload({}, res, url);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Length': String(1_048_576),
    }));
  });

  it('handles backpressure when write returns false', () => {
    const res = createMockRes();
    // First write returns false (buffer full), subsequent writes succeed
    res.write.mockReturnValueOnce(false).mockReturnValue(true);

    const url = new URL('http://localhost/download?bytes=100');
    handleDownload({}, res, url);

    // Should register a drain listener
    expect(res.once).toHaveBeenCalledWith('drain', expect.any(Function));
  });

  it('sets no-cache headers', () => {
    const res = createMockRes();
    const url = new URL('http://localhost/download?bytes=100');

    handleDownload({}, res, url);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    }));
  });
});

// ---------------------------------------------------------------------------
// handleUpload
// ---------------------------------------------------------------------------

describe('handleUpload', () => {
  let req;

  beforeEach(() => {
    req = new EventEmitter();
  });

  it('responds with bytesReceived after consuming body', () => {
    const res = createMockRes();

    handleUpload(req, res);

    req.emit('data', Buffer.alloc(1000));
    req.emit('data', Buffer.alloc(500));
    req.emit('end');

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'application/json',
    }));

    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.bytesReceived).toBe(1500);
  });

  it('responds with 0 bytes if no body sent', () => {
    const res = createMockRes();

    handleUpload(req, res);
    req.emit('end');

    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.bytesReceived).toBe(0);
  });

  it('responds with 500 on request error', () => {
    const res = createMockRes();

    handleUpload(req, res);
    req.emit('error', new Error('connection reset'));

    expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body.error).toBe('Upload failed');
  });

  it('sets CORS and no-cache headers on success', () => {
    const res = createMockRes();

    handleUpload(req, res);
    req.emit('end');

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    }));
  });
});
