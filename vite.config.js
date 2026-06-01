import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  base: '/supergene-esther/city2048/',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@scenes':  path.resolve(__dirname, './src/scenes'),
      '@prefabs': path.resolve(__dirname, './src/prefabs'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@config':  path.resolve(__dirname, './src/config'),
      '@styles':  path.resolve(__dirname, './src/styles'),
      '@core':    path.resolve(__dirname, './src/core'),
    },
  },
  optimizeDeps: {
    include: ['pixi.js'],
    esbuildOptions: { target: 'esnext' },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks(id) {
          if (id.includes('pixi.js') || id.includes('@pixi') || id.includes('node_modules/pixi')) {
            return 'pixi';
          }
          // Isolate React + scheduler into its own chunk so it fully initialises
          // before any app chunks run — prevents TDZ "Cannot access X before init" errors
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
