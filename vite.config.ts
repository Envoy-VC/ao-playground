import UnheadVite from '@unhead/addons/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { comlink } from 'vite-plugin-comlink';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';
import tsconfigPaths from 'vite-tsconfig-paths';

import path from 'path';

export default defineConfig({
  base: '',
  plugins: [
    nodePolyfills({ include: ['buffer'] }),
    react(),
    wasm(),
    topLevelAwait(),
    tsconfigPaths(),
    comlink(),
    UnheadVite(),
    ViteImageOptimizer(),
  ],
  worker: {
    plugins: () => [comlink()],
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      $: path.resolve(__dirname, './public'),
    },
  },
});
