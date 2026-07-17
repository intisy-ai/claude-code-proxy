import { expect, it } from "vitest";
import { anthropicProfile } from "./anthropic.js";
import { isValidProfile } from "../../core-proxy/dist/index.js";

it("anthropicProfile: passes isValidProfile", () => {
  expect(isValidProfile(anthropicProfile())).toBe(true);
});

it("anthropicProfile: nativeRateLimit produces a native rate_limit_error body with a retry-after header owned by the profile", async () => {
  const profile = anthropicProfile();
  const resetMs = Date.now() + 5000;
  const built = await profile.nativeRateLimit({ resetMs, upstream: null });

  expect(built.status).toBe(429);
  expect(built.body).toContain("rate_limit_error");

  const parsed = JSON.parse(built.body);
  expect(parsed.type).toBe("error");
  expect(parsed.error.type).toBe("rate_limit_error");

  // 5000ms -> ~5s; allow slack for wall-clock drift between resetMs capture and the call.
  const retryAfter = parseInt(built.headers["retry-after"], 10);
  expect(retryAfter).toBeGreaterThanOrEqual(4);
  expect(retryAfter).toBeLessThanOrEqual(5);
});

it("anthropicProfile: overrides are spread on top of the defaults", () => {
  const profile = anthropicProfile({ configFile: "custom.json" });
  expect(profile.configFile).toBe("custom.json");
  expect(profile.envPrefix).toBe("ANTHROPIC");
});

// Parity gate: proves the TeaVM-transpiled Java (AnthropicRateLimit.synthJson) reproduces
// header-stripping + 5h-reset reconciliation + retry-after math for a raw upstream 429.
it("anthropicProfile: nativeRateLimit reconciles an upstream 429 (5h-reset wins, headers stripped)", async () => {
  const profile = anthropicProfile();
  const now = Date.now();
  const fiveHourResetSec = Math.floor((now + 300_000) / 1000); // ~300s out — should win over resetMs
  const upstream = new Response(null, {
    status: 429,
    headers: {
      "anthropic-ratelimit-unified-5h-reset": String(fiveHourResetSec),
      "content-encoding": "gzip",
      "content-length": "123",
    },
  });

  const built = await profile.nativeRateLimit({ resetMs: now + 120_000, upstream });

  expect(built.status).toBe(429);
  expect(built.headers["content-type"]).toBe("application/json");
  expect(built.headers["content-encoding"]).toBeUndefined();
  expect(built.headers["content-length"]).toBeUndefined();
  expect(built.headers["anthropic-ratelimit-unified-status"]).toBe("rejected");

  const retryAfter = parseInt(built.headers["retry-after"], 10);
  expect(retryAfter).toBeGreaterThanOrEqual(290);
  expect(retryAfter).toBeLessThanOrEqual(300);

  const parsed = JSON.parse(built.body);
  expect(parsed.error.type).toBe("rate_limit_error");
});
