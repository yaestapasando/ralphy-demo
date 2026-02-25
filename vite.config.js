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
    setupFiles: ['./tests/setup-indexeddb.js'],
    environmentMatchGlobs: [
      ['**/*indicator.test.js', 'happy-dom'],
      ['**/*gauge.test.js', 'happy-dom'],
      ['**/*screen.test.js', 'happy-dom'],
      ['**/database.test.js', 'happy-dom'],
      ['**/history-table.test.js', 'happy-dom'],
      ['**/navigation.test.js', 'happy-dom'],
    ],
  },
});
