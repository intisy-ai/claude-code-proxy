package io.github.intisy.ai.js;

import io.github.intisy.ai.seam.SimpleJsonCodec;
import io.github.intisy.ai.claudeproxy.AnthropicRateLimit;
import io.github.intisy.ai.claudeproxy.ClaudeCodeProxyPlugin;
import io.github.intisy.ai.shared.routing.RoutingProfile;
import io.github.intisy.ai.api.seam.JsonCodec;

import org.teavm.jso.JSExport;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * TeaVM JS export of the claude-code {@link RoutingProfile}: both the 429-synth logic
 * ({@link #synthJson}) and the profile's DATA fields ({@link #profileJson}), single-sourced in
 * {@link ClaudeCodeProxyPlugin} (the same class ai-java's ServiceLoader-discovered proxy-plugin
 * jar uses) so anthropic.ts never hand-copies a second literal of the same tier/regex/env data.
 * JSON-in/JSON-out (same convention as CoreProxyJs), using the shared SimpleJsonCodec (TeaVM-safe).
 */
public final class ClaudeProxyJs {
    private ClaudeProxyJs() {
    }

    /**
     * The claude-code {@link RoutingProfile}'s DATA fields (everything but the {@code
     * nativeRateLimit} function and the app-wire {@code translator}, which stay JS-native on the
     * anthropic.ts side). Returns JSON: {@code {configFile, routingKey, tierSourceProvider,
     * tierOrder, tierFallback, tierRegex, nativeModelPattern, envPrefix, defaultContext,
     * defaultOutput}}, with {@code tierRegex}/{@code nativeModelPattern} as their {@code .pattern()}
     * strings (a JS caller wraps them back into a {@code RegExp}).
     */
    @JSExport
    public static String profileJson() {
        RoutingProfile p = new ClaudeCodeProxyPlugin().profile();
        JsonCodec json = new SimpleJsonCodec();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("configFile", p.configFile);
        out.put("routingKey", p.routingKey);
        out.put("tierSourceProvider", p.tierSourceProvider);
        out.put("tierOrder", p.tierOrder);
        out.put("tierFallback", p.tierFallback);
        out.put("tierRegex", p.tierRegex.pattern());
        out.put("nativeModelPattern", p.nativeModelPattern != null ? p.nativeModelPattern.pattern() : null);
        out.put("envPrefix", p.envPrefix);
        out.put("defaultContext", p.defaultContext);
        out.put("defaultOutput", p.defaultOutput);
        return json.stringify(out);
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
