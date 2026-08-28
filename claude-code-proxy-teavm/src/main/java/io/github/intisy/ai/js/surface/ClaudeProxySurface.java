package io.github.intisy.ai.js.surface;

import io.github.intisy.ai.tsemit.TsModule;

/**
 * The JavaScript module surface {@link io.github.intisy.ai.js.ClaudeProxyJs} exports, typed for a
 * TypeScript consumer.
 *
 * @implNote Never implemented, only emitted: {@link TsModule} renders its members as free functions,
 * which is the shape a TeaVM ES2015 module actually exports. Both are JSON in and JSON out, because
 * the values crossing here are a routing profile and a synthesized HTTP response, neither of which
 * has a stable structural type on the Java side that a caller would gain anything from.
 */
@TsModule
public interface ClaudeProxySurface {

    /**
     * The claude-code routing profile's data fields, as JSON.
     *
     * @implNote The regex fields arrive as their pattern strings, which a JS caller wraps back into
     * a RegExp; the profile's function-valued members stay JS-native and are not carried here.
     *
     * @return that data as a JSON object
     */
    String profileJson();

    /**
     * Synthesizes the rate-limit response for an upstream outcome, as JSON.
     *
     * @param argsJson the upstream status, its headers, the reset instant and now
     * @return the status, headers and body to answer with, as a JSON object
     */
    String synthJson(String argsJson);
}
