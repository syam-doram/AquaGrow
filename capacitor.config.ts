import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aquagrow.app',
  appName: 'Aquagrow',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // Keep the native Android splash visible until we manually hide it
      launchShowDuration: 0,
      launchAutoHide: false,
      // Match the AquaGrow amber brand color so there's zero white flash
      backgroundColor: '#C78200',
      androidSplashResourceName: 'splash',
      // Smooth fade out transition
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
