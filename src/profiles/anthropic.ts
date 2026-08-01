// The Claude/Anthropic RoutingProfile: config file, tier detection, and env-var
// naming for the claude-code tier source, plus the native Anthropic-shaped 429 the
// proxy synthesizes once every model in a tier's chain is rate-limited.
// nativeRateLimit is a thin marshalling adapter over the TeaVM-transpiled
// AnthropicRateLimit.synthJson, which owns the reset-reconciliation-with-upstream,
// header stripping, and message/retry-after math (single-sourced with the JVM jar).
// The profile's DATA fields (tiers, regex, env prefix, config file, defaults) are likewise
// single-sourced: ClaudeCodeProxyPlugin.java is the one place they are written down (it is also
// the ServiceLoader-discovered ProxyPlugin ai-java's example-server loads standalone, with no TS
// process involved), and profileJson exports that same data here via the TeaVM bridge instead of
// this file hand-copying a second literal.

import type { RateLimitInfo, RoutingProfile } from "../../core-proxy/dist/index.js";
import { synthJson, profileJson } from "../generated/anthropic-rate-limit.teavm.js";
import { anthropicTranslator } from "../../anthropic-translator/dist/index.js";

type AnthropicProfileData = {
  configFile: string;
  routingKey: string;
  tierSourceProvider: string;
  tierOrder: string[];
  tierFallback: string[];
  tierRegex: string;
  nativeModelPattern: string | null;
  envPrefix: string;
  defaultContext: number;
  defaultOutput: number;
};

const PROFILE_DATA: AnthropicProfileData = JSON.parse(profileJson());

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
  configFile: PROFILE_DATA.configFile,
  routingKey: PROFILE_DATA.routingKey,
  tierSourceProvider: PROFILE_DATA.tierSourceProvider,
  tierOrder: PROFILE_DATA.tierOrder,
  tierFallback: PROFILE_DATA.tierFallback,
  tierRegex: new RegExp(PROFILE_DATA.tierRegex),
  nativeModelPattern: PROFILE_DATA.nativeModelPattern ? new RegExp(PROFILE_DATA.nativeModelPattern) : undefined,
  envPrefix: PROFILE_DATA.envPrefix,
  defaultContext: PROFILE_DATA.defaultContext,
  defaultOutput: PROFILE_DATA.defaultOutput,
  nativeRateLimit,
  // Claude Code speaks Anthropic wire, so the IR front-door uses anthropic-translator's
  // AnthropicTranslator for this profile (server.ts's route() decodes/encodes through it).
  translator: anthropicTranslator,
};

export function anthropicProfile(overrides?: Partial<RoutingProfile>): RoutingProfile {
  return { ...ANTHROPIC_PROFILE, ...overrides };
}
