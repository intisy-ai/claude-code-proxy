// The in-process (no-daemon) transport of this app front-door: run serveIr over this app's profile
// + translator against a provider's injected handleIr, matching the daemon's encoding.

import { serveIr, type ServeIrOptions } from "@intisy-ai/core-proxy";
import { anthropicProfile } from "./profiles/anthropic.js";

export function serveDirect(request: Request, handleIr: ServeIrOptions["handleIr"], ctx: ServeIrOptions["ctx"]): Promise<Response> {
  return serveIr(request, { profile: anthropicProfile(), handleIr, ctx });
}
