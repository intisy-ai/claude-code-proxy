package io.github.intisy.ai.claudeproxy;

import io.github.intisy.ai.shared.routing.ProxyPlugin;
import io.github.intisy.ai.shared.routing.RoutingProfile;

import java.util.Arrays;
import java.util.regex.Pattern;

/**
 * The claude-code (Anthropic) {@link ProxyPlugin}, discovered via {@code ServiceLoader} from this
 * jar's {@code META-INF/services} entry. Provides the Anthropic routing profile (tier detection,
 * env naming, defaults, and the Anthropic-shaped synthesized 429), single-sourced in
 * {@link AnthropicRateLimit}.
 */
public final class ClaudeCodeProxyPlugin implements ProxyPlugin {
    private static final Pattern TIER_REGEX = Pattern.compile("^claude-([a-z]+)-\\d");
    private static final Pattern NATIVE_MODEL = Pattern.compile("^claude-");

    @Override
    public String id() {
        return "claude-code";
    }

    @Override
    public String displayName() {
        return "Claude Code";
    }

    @Override
    public RoutingProfile profile() {
        RoutingProfile p = new RoutingProfile();
        p.configFile = "claude-code-loader.json";
        p.routingKey = "providerRouting";
        p.tierSourceProvider = "claude-code";
        p.tierOrder = Arrays.asList("opus", "sonnet", "haiku", "fable");
        p.tierFallback = Arrays.asList("opus", "sonnet", "haiku");
        p.tierRegex = TIER_REGEX;
        p.nativeModelPattern = NATIVE_MODEL;
        p.envPrefix = "ANTHROPIC";
        p.defaultContext = 200000;
        p.defaultOutput = 64000;
        p.nativeRateLimit = info -> AnthropicRateLimit.synth(info, System.currentTimeMillis());
        return p;
    }
}
