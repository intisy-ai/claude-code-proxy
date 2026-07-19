// The Claude/Anthropic RoutingProfile: config file, tier detection, and env-var
// naming for the claude-code tier source, plus the native Anthropic-shaped 429 the
// proxy synthesizes once every model in a tier's chain is rate-limited.
// (`nativeRateLimit` is a thin marshalling adapter over the TeaVM-transpiled
// `AnthropicRateLimit.synthJson` — the reset-reconciliation-with-upstream, header
// stripping, and message/retry-after math all live in Java now (single-sourced
// with the JVM jar). This profile no longer re-implements any of that logic.)

import type { RateLimitInfo, RoutingProfile } from "../../core-proxy/dist/index.js";
import { synthJson } from "../generated/anthropic-rate-limit.teavm.js";
import { translators } from "../../core-ir/dist/index.js";

async function nativeRateLimit(info: RateLimitInfo): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const upstream = info.upstream;
  const upstreamHeaders: Record<string, string> = {};
  if (upstream) {
    for (const [k, v] of upstream.headers) upstreamHeaders[k] = v;
  }

  const out = JSON.parse(
    synthJson(
      JSON.stringify({
        upstreamStatus: upstream ? upstream.status : 0,
        upstreamHeaders,
        resetMs: info.resetMs || 0,
        now: Date.now(),
      }),
    ),
  );

  return { status: out.status, headers: out.headers, body: out.body };
}

const ANTHROPIC_PROFILE: RoutingProfile = {
  configFile: "claude-code-loader.json",
  routingKey: "providerRouting",
  tierSourceProvider: "claude-code",
  tierOrder: ["opus", "sonnet", "haiku", "fable"],
  tierFallback: ["opus", "sonnet", "haiku"],
  tierRegex: /^claude-([a-z]+)-\d/,
  nativeModelPattern: /^claude-/,
  envPrefix: "ANTHROPIC",
  defaultContext: 200000,
  defaultOutput: 64000,
  nativeRateLimit,
  // SP-3 T3a: Claude Code speaks Anthropic wire, so the IR front-door uses core-ir's real
  // AnthropicTranslator for this profile (server.ts's route() decodes/encodes through it).
  translator: translators.anthropic,
};

export function anthropicProfile(overrides?: Partial<RoutingProfile>): RoutingProfile {
  return { ...ANTHROPIC_PROFILE, ...overrides };
}
