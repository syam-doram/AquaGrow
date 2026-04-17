package com.aquagrow.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * AquaGrowMessagingService — Custom FCM handler.
 *
 * WHY this is needed:
 *  - When the app is KILLED, Android cannot call the JS Capacitor bridge.
 *  - If the FCM payload includes a "notification" key, Android displays it
 *    automatically (system tray) but Capacitor never sees it.
 *  - If the payload is DATA-ONLY (no "notification" key), Android wakes this
 *    service and we must build + post the notification manually.
 *  - This service handles BOTH cases and ensures notification channels exist.
 *
 * OEM battery savers (MIUI, One UI, OxygenOS) can still suppress notifications
 * for killed apps — ask users to whitelist the app in battery settings.
 */
public class AquaGrowMessagingService extends FirebaseMessagingService {

    // Channel IDs — must match those used in the server push payloads
    static final String CH_PREMIUM = "aquagrow-premium";
    static final String CH_AERATOR = "aquagrow-aerator";
    static final String CH_HARVEST = "aquagrow-harvest";
    static final String CH_MARKET  = "aquagrow-market";
    static final String CH_FEED    = "aquagrow-feed";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels(getApplicationContext());
    }

    /**
     * Called for every incoming FCM message when the app is killed or backgrounded.
     * For DATA-ONLY messages (no notification key in payload), we build + post
     * the notification here so the farmer always sees it.
     */
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        RemoteMessage.Notification notification = remoteMessage.getNotification();

        // If the server sent a notification payload, we construct it manually since
        // we intercepted the intent from Capacitor (so Capacitor's foreground listener
        // will not catch it). This ensures the notification reliably shows.
        String title = "AquaGrow Alert";
        String body = "You have a new farm alert.";

        if (notification != null) {
            if (notification.getTitle() != null) title = notification.getTitle();
            if (notification.getBody() != null) body = notification.getBody();
        } else if (!data.isEmpty()) {
            title = data.containsKey("title") ? data.get("title") : title;
            body  = data.containsKey("body")  ? data.get("body")
                  : data.containsKey("message") ? data.get("message") : body;
        }

        String type     = data.containsKey("type")     ? data.get("type")    : "";
        String deepLink = data.containsKey("deepLink") ? data.get("deepLink"): "";

        String channelId = resolveChannelId(type);
        int    color     = resolveColor(type);
        int    notifId   = resolveNotifId(type, data);

        postNotification(title, body, channelId, color, notifId, deepLink);
    }

    /**
     * Called when FCM issues a new registration token.
     * The Capacitor push-notifications plugin handles re-registration via JS.
     */
    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        android.util.Log.i("AquaGrow", "[FCM] New token: " + token.substring(0, Math.min(12, token.length())) + "...");
    }

    // ─── Build + post a local notification ───────────────────────────────────
    private void postNotification(String title, String body,
                                  String channelId, int color,
                                  int notifId, String deepLink) {
        Context ctx = getApplicationContext();

        Intent intent = new Intent(ctx, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (deepLink != null && !deepLink.isEmpty()) {
            intent.putExtra("deepLink", deepLink);
        }

        int piFlags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pendingIntent = PendingIntent.getActivity(ctx, notifId, intent, piFlags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, channelId)
                .setSmallIcon(R.drawable.ic_stat_aquagrow)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setColor(color)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(pendingIntent);

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(notifId, builder.build());
        }
    }

    // ─── Map FCM type → notification channel ─────────────────────────────────
    private String resolveChannelId(String type) {
        if (type == null) return CH_PREMIUM;
        switch (type) {
            case "aerator_check":  return CH_AERATOR;
            case "harvest_update": return CH_HARVEST;
            case "market_alert":   return CH_MARKET;
            case "feed_reminder":  return CH_FEED;
            default:               return CH_PREMIUM;
        }
    }

    // ─── Map type → accent color ──────────────────────────────────────────────
    private int resolveColor(String type) {
        if (type == null) return Color.parseColor("#10B981");
        switch (type) {
            case "aerator_check":  return Color.parseColor("#3B82F6");
            case "harvest_update": return Color.parseColor("#10B981");
            case "weather_alert":  return Color.parseColor("#F59E0B");
            case "iot_alert":      return Color.parseColor("#EF4444");
            case "market_alert":   return Color.parseColor("#8B5CF6");
            default:               return Color.parseColor("#10B981");
        }
    }

    // ─── Stable notification ID per (type, entity) ───────────────────────────
    private int resolveNotifId(String type, Map<String, String> data) {
        String pondId = data.containsKey("pondId") ? data.get("pondId") : "";
        String key    = (type != null ? type : "") + pondId;
        return Math.abs(key.hashCode());
    }

    // ─── Create all channels (safe to call repeatedly) ────────────────────────
    public static void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // { id, name, importance, hexColor }
        Object[][] channels = {
            { CH_PREMIUM, "AquaGrow Premium Alerts", NotificationManager.IMPORTANCE_HIGH,    "#10B981" },
            { CH_AERATOR, "Aerator Reminders",        NotificationManager.IMPORTANCE_HIGH,    "#3B82F6" },
            { CH_HARVEST, "Harvest Updates",          NotificationManager.IMPORTANCE_HIGH,    "#F59E0B" },
            { CH_MARKET,  "Market Prices",            NotificationManager.IMPORTANCE_DEFAULT, "#8B5CF6" },
            { CH_FEED,    "Feed Reminders",           NotificationManager.IMPORTANCE_HIGH,    "#22C55E" },
        };

        for (Object[] ch : channels) {
            String id         = (String) ch[0];
            String name       = (String) ch[1];
            int    importance = (int)    ch[2];
            String hexColor   = (String) ch[3];

            NotificationChannel channel = new NotificationChannel(id, name, importance);
            channel.setDescription("AquaGrow farm intelligence alerts");
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor(hexColor));
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 100, 250});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setShowBadge(true);
            nm.createNotificationChannel(channel);
        }
    }
}
