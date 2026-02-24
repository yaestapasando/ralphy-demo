/**
 * Vite plugin that adds local speed-test server endpoints.
 *
 * Endpoints:
 *   GET  /ping           → 204 No Content (for latency measurement)
 *   GET  /download?bytes= → responds with `bytes` random bytes (default 1 MB)
 *   POST /upload          → consumes the request body and reports bytes received
 *
 * This removes the need for an external speed-test server during development
 * and can also be used in production behind a simple Node/Express server.
 */

import { randomBytes } from 'node:crypto';

const DEFAULT_DOWNLOAD_BYTES = 1_048_576; // 1 MB
const MAX_DOWNLOAD_BYTES = 104_857_600; // 100 MB

/**
 * @returns {import('vite').Plugin}
 */
export default function testServerPlugin() {
  return {
    name: 'speed-test-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname === '/ping') {
          return handlePing(req, res);
        }

        if (url.pathname === '/download') {
          return handleDownload(req, res, url);
        }

        if (url.pathname === '/upload') {
          return handleUpload(req, res);
        }

        next();
      });
    },
  };
}

/**
 * GET /ping → 204 No Content with CORS and cache-control headers.
 */
function handlePing(_req, res) {
  res.writeHead(204, {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  });
  res.end();
}

/**
 * GET /download?bytes=N → sends N random bytes (default 1 MB, max 100 MB).
 */
function handleDownload(_req, res, url) {
  const requested = parseInt(url.searchParams.get('bytes'), 10);
  const bytes = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, MAX_DOWNLOAD_BYTES)
    : DEFAULT_DOWNLOAD_BYTES;

  const CHUNK_SIZE = 65_536; // 64 KB chunks
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(bytes),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  });

  let remaining = bytes;
  function writeChunk() {
    while (remaining > 0) {
      const size = Math.min(CHUNK_SIZE, remaining);
      const chunk = randomBytes(size);
      remaining -= size;
      if (!res.write(chunk)) {
        res.once('drain', writeChunk);
        return;
      }
    }
    res.end();
  }
  writeChunk();
}

/**
 * POST /upload → consumes the request body and responds with bytes received.
 */
function handleUpload(req, res) {
  let bytesReceived = 0;

  req.on('data', (chunk) => {
    bytesReceived += chunk.length;
  });

  req.on('end', () => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ bytesReceived }));
  });

  req.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Upload failed' }));
  });
}

export { handlePing, handleDownload, handleUpload };
