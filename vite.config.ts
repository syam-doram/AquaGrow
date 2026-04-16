import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      watch: {
        ignored: ['**/server/db.json'],
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    // Drop console/debugger in production
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      chunkSizeWarningLimit: 2000,
      minify: 'esbuild', // esbuild is extremely fast and effective
      target: 'es2022',  // modern target reduces polyfill bloat
      cssMinify: true,
      cssCodeSplit: true,
      assetsInlineLimit: 10240, // inline small assets to reduce requests
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Group common libs into stable buckets to avoid circular dep crashes
              if (id.includes('react') || id.includes('router') || id.includes('framer-motion') || id.includes('motion')) return 'vendor-core';
              if (id.includes('firebase')) return 'vendor-fb';
              if (id.includes('recharts') || id.includes('d3')) return 'vendor-viz';
              return 'vendor-libs';
            }
          }
        }
      }
    },
  };
});
