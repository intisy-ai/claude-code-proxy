export * from "@intisy-ai/core-proxy";
export { anthropicProfile } from "./profiles/anthropic.js";
export { serveDirect } from "./serve-direct.js";

import { anthropicProfile } from "./profiles/anthropic.js";
import type { RoutingProfile } from "@intisy-ai/core-proxy";

/** What a host needs to offer this app as a proxy target: who it is, and how to point it here. */
export const proxyDef: {
  /** Which app this proxy serves. */
  app: "claude";
  /** What a surface calls it. */
  label: string;
  /** What an operator must do to point that app here. */
  setup: string;
  /** The routing profile it serves the app with. */
  profile: () => RoutingProfile;
} = {
  app: "claude",
  label: "Claude Code",
  setup: "Set ANTHROPIC_BASE_URL to the local API base URL and ANTHROPIC_API_KEY to any non-empty value, then start Claude Code. The Claude Code loader sets these for you.",
  profile: anthropicProfile,
};
