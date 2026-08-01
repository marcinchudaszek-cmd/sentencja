package pl.sentencja.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.Locale;

/**
 * Widget z cytatem dnia. Czyta wlasna kopie bazy z assets, wiec dziala bez
 * uruchamiania aplikacji. Wybor cytatu uzywa tego samego hasha FNV-1a i tej
 * samej kolejnosci danych co warstwa webowa (src/lib/daily.ts), dzieki czemu
 * widget i aplikacja zawsze pokazuja ten sam cytat.
 */
public class DailyQuoteWidget extends AppWidgetProvider {

    private static final String TAG = "SentencjaWidget";
    private static final String ASSET = "quotes-widget.json";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            aktualizuj(context, manager, id);
        }
    }

    private void aktualizuj(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily);

        JSONObject cytat = cytatDnia(context);
        String tresc = context.getString(R.string.widget_fallback);
        String autor = "";
        String quoteId = null;

        if (cytat != null) {
            tresc = cytat.optString("t", tresc);
            autor = cytat.optString("a", "");
            quoteId = cytat.optString("id", null);
        }

        views.setTextViewText(R.id.widget_quote, tresc);
        views.setTextViewText(R.id.widget_author, autor);

        // Dotkniecie widgetu otwiera ten konkretny cytat w aplikacji.
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (quoteId != null) {
            intent.setData(Uri.parse("sentencja://cytat/" + quoteId));
        }
        int flagi = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pending = PendingIntent.getActivity(context, widgetId, intent, flagi);
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        manager.updateAppWidget(widgetId, views);
    }

    /** Deterministyczny cytat dla dzisiejszej daty. */
    private JSONObject cytatDnia(Context context) {
        try {
            JSONArray baza = wczytajBaze(context);
            if (baza.length() == 0) return null;
            long indeks = hash("sentencja:" + kluczDaty()) % baza.length();
            return baza.getJSONObject((int) indeks);
        } catch (Exception e) {
            Log.w(TAG, "Nie udalo sie wyznaczyc cytatu dnia", e);
            return null;
        }
    }

    private JSONArray wczytajBaze(Context context) throws Exception {
        try (InputStream in = context.getAssets().open(ASSET)) {
            ByteArrayOutputStream bufor = new ByteArrayOutputStream();
            byte[] porcja = new byte[8192];
            int n;
            while ((n = in.read(porcja)) != -1) {
                bufor.write(porcja, 0, n);
            }
            return new JSONArray(new String(bufor.toByteArray(), StandardCharsets.UTF_8));
        }
    }

    /** Format RRRR-MM-DD, zgodny z dateKey() w warstwie webowej. */
    private String kluczDaty() {
        Calendar c = Calendar.getInstance();
        return String.format(
                Locale.US,
                "%04d-%02d-%02d",
                c.get(Calendar.YEAR),
                c.get(Calendar.MONTH) + 1,
                c.get(Calendar.DAY_OF_MONTH));
    }

    /**
     * FNV-1a, bit w bit jak Math.imul w JavaScripcie. Liczymy na int
     * (przepelnienie ze znakiem jest tu pozadane), a wynik czytamy bez znaku.
     */
    private long hash(String s) {
        int h = (int) 2166136261L;
        for (int i = 0; i < s.length(); i++) {
            h ^= s.charAt(i);
            h *= 16777619;
        }
        return h & 0xFFFFFFFFL;
    }
}
