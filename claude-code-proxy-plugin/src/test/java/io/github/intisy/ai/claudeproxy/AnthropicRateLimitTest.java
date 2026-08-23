package io.github.intisy.ai.claudeproxy;

import io.github.intisy.ai.shared.routing.RoutingProfile;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnthropicRateLimitTest {
    @Test
    void upstream429_copiesHeaders_reconcilesReset_recomputesRetryAfter() {
        long now = 1_000_000_000_000L;
        long reset = now + 120_000; // 120s out
        Map<String, String> up = new LinkedHashMap<>();
        up.put("content-encoding", "gzip");        // must be stripped
        up.put("content-length", "10");            // must be stripped
        up.put("anthropic-ratelimit-unified-5h-reset", String.valueOf((now + 300_000) / 1000)); // 300s -> wins
        RoutingProfile.Synth s = AnthropicRateLimit.synthCore(429, up, reset, now);

        assertEquals(429, s.status);
        assertEquals("application/json", s.headers.get("content-type"));
        assertEquals(null, s.headers.get("content-encoding"));
        assertEquals(null, s.headers.get("content-length"));
        assertEquals("300", s.headers.get("retry-after")); // reconciled reset (300s) wins over 120s
        assertEquals("rejected", s.headers.get("anthropic-ratelimit-unified-status"));
        assertTrue(s.body.contains("\"type\":\"rate_limit_error\""));
        assertTrue(s.body.contains("resets at"));
    }

    @Test
    void noUpstream_fallsBackTo60sAndTryAgainLater() {
        long now = 1_000_000_000_000L;
        RoutingProfile.Synth s = AnthropicRateLimit.synthCore(200, new LinkedHashMap<>(), 0, now);
        assertEquals(429, s.status);
        assertEquals("60", s.headers.get("retry-after"));
        assertTrue(s.body.contains("try again later"));
    }
}
