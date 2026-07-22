export * from "../core-proxy/dist/index.js";
export { anthropicProfile } from "./profiles/anthropic.js";

import { anthropicProfile } from "./profiles/anthropic.js";
import type { RoutingProfile } from "../core-proxy/dist/index.js";

export const proxyDef: { app: "claude"; label: string; profile: () => RoutingProfile } = {
  app: "claude",
  label: "Claude Code",
  profile: anthropicProfile,
};
