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
    build: {
      chunkSizeWarningLimit: 600,
      minify: 'esbuild',
      target: 'es2020',
      assetsInlineLimit: 4096,
      rollupOptions: {
        // Exclude server-only packages from the frontend bundle
        external: (id) => {
          const serverOnly = [
            'express', 'mongoose', 'mongodb', 'bcryptjs', 'jsonwebtoken',
            'firebase-admin', 'cors', 'dotenv', 'express-rate-limit',
          ];
          return serverOnly.some(pkg => id === pkg || id.startsWith(pkg + '/'));
        },
        output: {
          // Manual chunks — split heavy vendors into separate cacheable files
          manualChunks: (id) => {
            // React core
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-is/')) {
              return 'vendor-react';
            }
            // Router
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            // Animation
            if (id.includes('node_modules/motion') ||
                id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // Charts
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/d3-') ||
                id.includes('node_modules/victory-')) {
              return 'vendor-charts';
            }
            // Firebase Firestore
            if (id.includes('node_modules/firebase/firestore') ||
                id.includes('node_modules/@firebase/firestore')) {
              return 'vendor-firestore';
            }
            // Firebase Storage
            if (id.includes('node_modules/firebase/storage') ||
                id.includes('node_modules/@firebase/storage')) {
              return 'vendor-firebase-storage';
            }
            // Firebase Auth
            if (id.includes('node_modules/firebase/auth') ||
                id.includes('node_modules/@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            // Firebase core
            if (id.includes('node_modules/firebase') ||
                id.includes('node_modules/@firebase/')) {
              return 'vendor-firebase-core';
            }
            // Gemini AI SDK
            if (id.includes('node_modules/@google/genai')) {
              return 'vendor-ai';
            }
            // Capacitor
            if (id.includes('node_modules/@capacitor') ||
                id.includes('node_modules/@capgo/')) {
              return 'vendor-capacitor';
            }
            // Lucide icons
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // Date utils
            if (id.includes('node_modules/date-fns')) {
              return 'vendor-date';
            }
            // All other node_modules
            if (id.includes('node_modules/')) {
              return 'vendor-misc';
            }
          },
        },
      },
      // Drop console logs in production builds
      esbuildOptions: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
    },
  };
});
