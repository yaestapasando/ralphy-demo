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
  },
});
