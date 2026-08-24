import { frontDoor } from "@intisy-ai/core-proxy";
import { anthropicProfile } from "./profiles/anthropic.js";

/**
 * What an in-process host loads: this app's wire format, as the `front-door` capability.
 *
 * @remarks
 * Typed structurally rather than as api's `Plugin`, because this repo carries no `core` submodule
 * and so cannot resolve the api package through the nested `core/api` route every plugin repo uses.
 * A host duck-types `activate` and `deactivate`, and `frontDoor()` already returns the capability
 * shape api declares.
 */
const plugin = {
  activate(context: { provide: (id: string, implementation: unknown) => void }) {
    context.provide("front-door", frontDoor(anthropicProfile()));
  },
  deactivate() {},
};

export default plugin;
