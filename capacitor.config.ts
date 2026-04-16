import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aquagrow.app',
  appName: 'AquaGrow',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // Keep the native Android splash visible until we manually hide it.
      // 2500ms covers the time needed for lazy JS chunks to load on first launch.
      launchShowDuration: 2500,
      launchAutoHide: false,
      // Match the new dark icon background — no jarring color flash
      backgroundColor: '#1A1A1A',
      androidSplashResourceName: 'splash',
      // Smooth fade out transition
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      fadeInDuration: 200,
      fadeOutDuration: 400,
    },
    FirebaseAuthentication: {
      // List every sign-in provider you use.
      // The plugin throws "Phone sign-in provider is not enabled" if 'phone'
      // is missing from this array when signInWithPhoneNumber() is called.
      skipNativeAuth: false,
      providers: ['phone'],
    },
    PushNotifications: {
      // Show the push notification UI even when app is in the foreground.
      // Without this, FCM foreground messages are invisible on iOS.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      // Use ic_stat_aquagrow — the white vector drawable created in res/drawable/
      // ic_launcher is NOT a valid notification icon (it breaks on API 21+).
      smallIcon: 'ic_stat_aquagrow',
      iconColor: '#10B981',
      // Show notification content on the lock screen (PUBLIC visibility)
      // PRIVATE hides content, SECRET hides the notification entirely.
      // Must be PUBLIC for farmers to see pond alerts on locked screen.
      sound: 'default',
    },
  },
};

export default config;
