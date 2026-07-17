package io.github.intisy.ai.claudeproxy;

import io.github.intisy.ai.shared.routing.RateLimitInfo;
import io.github.intisy.ai.shared.routing.RoutingProfile;
import io.github.intisy.ai.shared.spi.http.HttpResponse;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Single source of the Anthropic-shaped synthesized 429: copy an upstream 429's headers, reconcile
 * the reset from anthropic-ratelimit-* headers, recompute retry-after from wall-clock, and emit a
 * rate_limit_error body. Ported verbatim from ai-java's {@code AppProfiles.synthesize429}, with
 * {@code now} injected as a parameter (a real seam, not {@code System.currentTimeMillis()}) so this
 * is deterministically testable and TeaVM-transpilable (no java.net/java.nio).
 */
public final class AnthropicRateLimit {
    private AnthropicRateLimit() {
    }

    /** Unwraps {@link RateLimitInfo} (whose {@code upstream} may be null) into {@link #synthCore}. */
    public static RoutingProfile.Synth synth(RateLimitInfo info, long now) {
        HttpResponse upstream = info != null ? info.upstream : null;
        int upstreamStatus = upstream != null ? upstream.status : 0;
        Map<String, String> upstreamHeaders = upstream != null ? upstream.headers : null;
        long resetMs = info != null ? info.resetMs : 0;
        return synthCore(upstreamStatus, upstreamHeaders, resetMs, now);
    }

    /**
     * Pure logic: a non-429 upstream status or an empty/null header map is treated as "no
     * upstream" (matches the original {@code upstream.status == 429 && upstream.headers != null}
     * guard).
     */
    public static RoutingProfile.Synth synthCore(int upstreamStatus, Map<String, String> upstreamHeaders,
                                                  long resetMs, long now) {
        long reset = resetMs > 0 ? resetMs : 0;
        Map<String, String> headers = new LinkedHashMap<>();
        if (upstreamStatus == 429 && upstreamHeaders != null && !upstreamHeaders.isEmpty()) {
            headers.putAll(upstreamHeaders);
            headers.remove("content-encoding");
            headers.remove("content-length");
            headers.remove("x-hub-rate-limited");
            headers.remove("x-hub-retry-after-ms");
            for (String k : new String[]{"anthropic-ratelimit-unified-5h-reset", "anthropic-ratelimit-unified-reset"}) {
                String s = headers.get(k);
                if (s != null) {
                    try {
                        long sec = Long.parseLong(s.trim());
                        if (sec * 1000 > reset) reset = sec * 1000;
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        String message = reset > now
                ? "You've hit your usage limit · resets at " + new SimpleDateFormat("h:mm a z").format(new Date(reset))
                : "You've hit your usage limit · try again later";
        headers.put("content-type", "application/json");
        headers.put("retry-after", String.valueOf(reset > now ? Math.round((reset - now) / 1000.0) : 60));
        headers.putIfAbsent("anthropic-ratelimit-unified-status", "rejected");
        headers.putIfAbsent("anthropic-ratelimit-unified-reset", String.valueOf((reset > 0 ? reset : now) / 1000));

        RoutingProfile.Synth synth = new RoutingProfile.Synth();
        synth.status = 429;
        synth.headers = headers;
        synth.body = "{\"type\":\"error\",\"error\":{\"type\":\"rate_limit_error\",\"message\":" + quote(message) + "}}";
        return synth;
    }

    private static String quote(String value) {
        StringBuilder sb = new StringBuilder(value.length() + 2).append('"');
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        String hex = Integer.toHexString(c);
                        sb.append("\\u");
                        for (int p = hex.length(); p < 4; p++) sb.append('0');
                        sb.append(hex);
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.append('"').toString();
    }
}
