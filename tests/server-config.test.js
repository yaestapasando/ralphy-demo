import { describe, it, expect } from 'vitest';
import { getServerConfig, buildDownloadUrl } from '../src/services/server-config.js';

describe('getServerConfig', () => {
  it('returns default endpoints', () => {
    const config = getServerConfig();
    expect(config).toEqual({
      pingUrl: '/ping',
      downloadUrl: '/download',
      uploadUrl: '/upload',
    });
  });

  it('allows partial overrides', () => {
    const config = getServerConfig({ pingUrl: '/custom-ping' });
    expect(config.pingUrl).toBe('/custom-ping');
    expect(config.downloadUrl).toBe('/download');
    expect(config.uploadUrl).toBe('/upload');
  });

  it('allows full override', () => {
    const config = getServerConfig({
      pingUrl: '/a',
      downloadUrl: '/b',
      uploadUrl: '/c',
    });
    expect(config).toEqual({ pingUrl: '/a', downloadUrl: '/b', uploadUrl: '/c' });
  });
});

describe('buildDownloadUrl', () => {
  it('appends bytes as query parameter', () => {
    expect(buildDownloadUrl(1048576)).toBe('/download?bytes=1048576');
  });

  it('uses custom base URL when provided', () => {
    expect(buildDownloadUrl(500, '/custom')).toBe('/custom?bytes=500');
  });

  it('handles zero bytes', () => {
    expect(buildDownloadUrl(0)).toBe('/download?bytes=0');
  });
});
