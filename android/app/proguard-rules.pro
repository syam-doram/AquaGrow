# ─── AquaGrow · ProGuard / R8 Rules ──────────────────────────────────────────
# Applied for release builds only. R8 full-mode is enabled via
# proguard-android-optimize.txt in build.gradle.

# ── Capacitor / WebView JS bridge ───────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# ── Firebase ─────────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Firebase App Check ────────────────────────────────────────────────────────
-keep class com.google.firebase.appcheck.** { *; }

# ── AndroidX / Support library ───────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Coroutines (used by Firebase internally) ─────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**

# ── Reflection entrypoints ───────────────────────────────────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# ── Crash / stack trace readability (optional but useful for debugging) ───────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Suppress known-safe warnings ─────────────────────────────────────────────
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
-dontwarn sun.misc.Unsafe
-dontwarn java.lang.invoke.**
