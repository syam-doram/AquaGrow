package com.aquagrow.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Create all FCM notification channels upfront so Android doesn't silently
        // drop the first notification (channels must exist before first delivery).
        AquaGrowMessagingService.createNotificationChannels(this);

        // Firebase App Check — use Debug provider for debug builds, Play Integrity for release
        FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
        if (BuildConfig.DEBUG) {
            // Debug builds: bypass App Check so Firebase Phone Auth OTP works
            firebaseAppCheck.installAppCheckProviderFactory(
                DebugAppCheckProviderFactory.getInstance()
            );
        } else {
            // Release builds: use Play Integrity (production)
            firebaseAppCheck.installAppCheckProviderFactory(
                PlayIntegrityAppCheckProviderFactory.getInstance()
            );
        }

        // ── Handle killed-state notification tap deep-link ──────────────────
        // When the app is KILLED and the user taps an FCM notification, Android
        // launches a fresh MainActivity with the Intent containing our "deepLink"
        // extra (set in AquaGrowMessagingService.postNotification).
        // We inject it into sessionStorage so useFirebaseAlerts.ts picks it up
        // on its first render cycle, just like a foreground notification tap.
        handleDeepLinkFromIntent(getIntent());
    }

    /**
     * Forward deep-link intents to the Capacitor bridge.
     *
     * When Firebase phone auth uses browser-based reCAPTCHA as a fallback
     * (SafetyNet / Play Integrity not available), it opens Chrome and after
     * the challenge redirects back via:
     *   com.aquagrow.app://__/auth/handler?...
     *
     * Because the activity is singleTask, Android calls onNewIntent() on the
     * existing instance.  Without calling setIntent() + bridge.onNewIntent()
     * the Capacitor/Firebase plugin never sees the deep-link URL, the reCAPTCHA
     * token is lost, and every subsequent OTP entry fails with
     * "auth/invalid-verification-code" or "auth/session-expired".
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Update the activity's intent so getIntent() returns the latest one
        setIntent(intent);
        // Notify the Capacitor bridge — this re-broadcasts the URL open event
        // to all plugins including @capacitor-firebase/authentication
        if (getBridge() != null) {
            getBridge().onNewIntent(intent);
        }
        // Also check for a deepLink extra on the new intent (background→foreground tap)
        handleDeepLinkFromIntent(intent);
    }

    /**
     * Reads the "deepLink" extra from an FCM-tapped Intent and stores it in
     * sessionStorage so the JS side (useFirebaseAlerts) can route to it.
     * Safe to call multiple times — no-ops when there is no extra.
     */
    private void handleDeepLinkFromIntent(Intent intent) {
        if (intent == null) return;
        String deepLink = intent.getStringExtra("deepLink");
        if (deepLink == null || deepLink.isEmpty()) return;

        // Escape single quotes to prevent JS injection issues
        final String safeLink = deepLink.replace("'", "\\'");

        // Post to WebView after bridge is ready (100 ms grace period is sufficient)
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "sessionStorage.setItem('aqua_notification_deeplink', '" + safeLink + "');",
                    null
                );
                android.util.Log.i("AquaGrow", "[DeepLink] Injected from killed-state: " + safeLink);
            }
        }, 500);
    }
}
