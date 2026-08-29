// The in-process (no-daemon) transport of this app front-door: run serveIr over this app's profile
// + translator against a provider's injected handleIr, matching the daemon's encoding.

import { serveIr, type ServeIrOptions } from "@intisy-ai/basekit/proxy";
import { anthropicProfile } from "./profiles/anthropic.js";

/**
 * Answers one request in-process, with no proxy daemon in between.
 *
 * @param request the app's own wire request.
 * @param handleIr the provider that answers it, in canonical IR.
 * @param ctx what that provider is given alongside the request.
 * @returns the app's own wire response.
 */
export function serveDirect(request: Request, handleIr: ServeIrOptions["handleIr"], ctx: ServeIrOptions["ctx"]): Promise<Response> {
  return serveIr(request, { profile: anthropicProfile(), handleIr, ctx });
}
