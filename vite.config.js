import { defineConfig } from 'vite';
import testServerPlugin from './vite-plugin-test-server.js';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [testServerPlugin()],
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*indicator.test.js', 'happy-dom'],
      ['**/*gauge.test.js', 'happy-dom'],
      ['**/*screen.test.js', 'happy-dom'],
    ],
  },
});
