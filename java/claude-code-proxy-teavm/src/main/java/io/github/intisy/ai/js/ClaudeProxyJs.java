package io.github.intisy.ai.js;

import io.github.intisy.ai.claudeproxy.AnthropicRateLimit;
import io.github.intisy.ai.shared.routing.RoutingProfile;
import io.github.intisy.ai.shared.spi.JsonCodec;

import org.teavm.jso.JSExport;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * TeaVM JS export of the Anthropic 429 synth: the single-source logic in AnthropicRateLimit,
 * exposed so anthropic.ts consumes the transpiled copy rather than reimplementing it in TypeScript.
 * JSON-in/JSON-out (same convention as CoreProxyJs), using the shared SimpleJsonCodec (TeaVM-safe).
 */
public final class ClaudeProxyJs {
    private ClaudeProxyJs() {
    }

    /**
     * args JSON: {"upstreamStatus":int,"upstreamHeaders":{k:v,...},"resetMs":long,"now":long}.
     * Returns {"status":int,"headers":{k:v,...},"body":string}.
     */
    @JSExport
    public static String synthJson(String argsJson) {
        JsonCodec json = new SimpleJsonCodec();
        Map<?, ?> args = (Map<?, ?>) json.parse(argsJson);

        int upstreamStatus = (int) toLong(args.get("upstreamStatus"));
        long resetMs = toLong(args.get("resetMs"));
        long now = toLong(args.get("now"));

        Map<String, String> headers = new HashMap<>();
        Object h = args.get("upstreamHeaders");
        if (h instanceof Map) {
            for (Map.Entry<?, ?> e : ((Map<?, ?>) h).entrySet()) {
                headers.put(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
            }
        }

        RoutingProfile.Synth s = AnthropicRateLimit.synthCore(upstreamStatus, headers, resetMs, now);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", s.status);
        out.put("headers", s.headers != null ? s.headers : new LinkedHashMap<>());
        out.put("body", s.body);
        return json.stringify(out);
    }

    private static long toLong(Object o) {
        return o instanceof Number ? ((Number) o).longValue() : 0L;
    }
}
