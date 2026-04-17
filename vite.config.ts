import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';
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
    // Drop console/debugger from production builds
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none', // strips license comment blocks → smaller output
    },
    build: {
      chunkSizeWarningLimit: 1500,
      minify: 'esbuild',
      target: 'es2022',        // modern target — fewer polyfills
      cssMinify: true,
      cssCodeSplit: true,
      // Keep small assets inline; skip base64-encoding large ones
      assetsInlineLimit: 4096,
      // R8 already handles the native layer; strip source maps from the web bundle
      sourcemap: false,
      rollupOptions: {
        output: {
          // ── Manual chunk buckets ───────────────────────────────────────────
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // React + router — always needed, keep tiny
            if (id.includes('/react/') || id.includes('/react-dom/') ||
                id.includes('react-router') || id.includes('scheduler'))
              return 'vendor-react';

            // Animation library
            if (id.includes('/motion/') || id.includes('framer-motion'))
              return 'vendor-motion';

            // Firebase — bundle once, loaded lazily
            if (id.includes('firebase'))
              return 'vendor-firebase';

            // Gemini AI SDK
            if (id.includes('@google/genai'))
              return 'vendor-ai';

            // Charts / data-viz
            if (id.includes('recharts') || id.includes('@types/d3') || id.includes('/d3'))
              return 'vendor-charts';

            // Everything else in node_modules
            return 'vendor-misc';
          },
          // Deterministic hashes keep CDN caching stable between deploys
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
        // Tree-shake unused exports from big libraries
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
        },
      },
    },
  };
});
