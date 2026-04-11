package com.aquagrow.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
    }
}
