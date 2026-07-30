export * from "../core-proxy/dist/index.js";
export { anthropicProfile } from "./profiles/anthropic.js";

import { anthropicProfile } from "./profiles/anthropic.js";
import type { RoutingProfile } from "../core-proxy/dist/index.js";

export const proxyDef: { app: "claude"; label: string; setup: string; profile: () => RoutingProfile } = {
  app: "claude",
  label: "Claude Code",
  setup: "Set ANTHROPIC_BASE_URL to the local API base URL and ANTHROPIC_API_KEY to any non-empty value, then start Claude Code. The Claude Code loader sets these for you.",
  profile: anthropicProfile,
};
