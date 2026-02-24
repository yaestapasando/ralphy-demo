import { describe, it, expect, vi } from 'vitest';
import testServerPlugin from '../vite-plugin-test-server.js';

/**
 * Creates a mock request/response pair for middleware testing.
 */
function createMockReqRes(url, method = 'GET') {
  const req = {
    url,
    method,
    headers: { host: 'localhost:5173' },
    on: vi.fn(),
  };
  const res = {
    writeHead: vi.fn(),
    write: vi.fn().mockReturnValue(true),
    end: vi.fn(),
    once: vi.fn(),
  };
  return { req, res };
}

describe('testServerPlugin', () => {
  it('returns a plugin with the correct name', () => {
    const plugin = testServerPlugin();
    expect(plugin.name).toBe('speed-test-server');
  });

  it('registers middleware via configureServer', () => {
    const plugin = testServerPlugin();
    const middlewares = { use: vi.fn() };
    plugin.configureServer({ middlewares });

    expect(middlewares.use).toHaveBeenCalledTimes(1);
    expect(typeof middlewares.use.mock.calls[0][0]).toBe('function');
  });

  it('routes /ping to ping handler', () => {
    const plugin = testServerPlugin();
    let middleware;
    const middlewares = { use: vi.fn((fn) => { middleware = fn; }) };
    plugin.configureServer({ middlewares });

    const { req, res } = createMockReqRes('/ping');
    const next = vi.fn();
    middleware(req, res, next);

    expect(res.writeHead).toHaveBeenCalledWith(204, expect.any(Object));
    expect(next).not.toHaveBeenCalled();
  });

  it('routes /ping with query params to ping handler', () => {
    const plugin = testServerPlugin();
    let middleware;
    const middlewares = { use: vi.fn((fn) => { middleware = fn; }) };
    plugin.configureServer({ middlewares });

    const { req, res } = createMockReqRes('/ping?t=12345');
    const next = vi.fn();
    middleware(req, res, next);

    expect(res.writeHead).toHaveBeenCalledWith(204, expect.any(Object));
    expect(next).not.toHaveBeenCalled();
  });

  it('routes /download to download handler', () => {
    const plugin = testServerPlugin();
    let middleware;
    const middlewares = { use: vi.fn((fn) => { middleware = fn; }) };
    plugin.configureServer({ middlewares });

    const { req, res } = createMockReqRes('/download?bytes=100');
    const next = vi.fn();
    middleware(req, res, next);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'application/octet-stream',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('routes /upload to upload handler', () => {
    const plugin = testServerPlugin();
    let middleware;
    const middlewares = { use: vi.fn((fn) => { middleware = fn; }) };
    plugin.configureServer({ middlewares });

    const { req, res } = createMockReqRes('/upload', 'POST');
    const next = vi.fn();
    middleware(req, res, next);

    // Upload handler sets up data/end/error listeners
    expect(req.on).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('passes through to next middleware for unknown paths', () => {
    const plugin = testServerPlugin();
    let middleware;
    const middlewares = { use: vi.fn((fn) => { middleware = fn; }) };
    plugin.configureServer({ middlewares });

    const { req, res } = createMockReqRes('/other-path');
    const next = vi.fn();
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.writeHead).not.toHaveBeenCalled();
  });
});
