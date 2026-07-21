// Proves the IR front-door is ACTIVE on the real anthropicProfile (not a hand-rolled
// stand-in): anthropicProfile() carries core-ir's real AnthropicTranslator, so an inbound
// Anthropic-wire request decodes to IR, routes on IrRequest.model, reaches a handleIr-capable
// handler, and the IrResponse is encoded back to Anthropic wire by createProxyServer (core-proxy).
import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createProxyServer } from "../core-proxy/dist/index.js";
import { anthropicProfile } from "./profiles/anthropic.js";
import { translators } from "../core-ir/dist/index.js";
import type { IrRequest, IrResponse } from "../core-ir/dist/index.js";

let dir: string, srv: any;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ccp-srv-ir-"));
  mkdirSync(join(dir, "config"), { recursive: true });
});
afterEach(async () => { if (srv) await srv.close(); rmSync(dir, { recursive: true, force: true }); });

it("anthropicProfile() has a translator wired, activating the IR front-door", () => {
  expect(anthropicProfile().translator).toBe(translators.anthropic);
});

it("decodes inbound Anthropic wire -> IR -> handleIr -> encodes IR back to Anthropic wire", async () => {
  writeFileSync(
    join(dir, "config", "claude-code-loader.json"),
    JSON.stringify({ modelMap: { opus: [{ provider: "ok", model: "claude-opus-4-1" }] } }),
  );
  const handlers: any = {
    ok: {
      handle: async () => { throw new Error("legacy handle() must not be called when the IR path is active"); },
      handleIr: async (ir: IrRequest, ctx: any): Promise<IrResponse> => ({
        id: "msg_ir",
        model: ctx.model,
        content: [{ kind: "text", text: "ir front-door: " + ((ir.messages[0]?.content[0] as any)?.text ?? "") }],
        stopReason: "end_turn",
        usage: { inputTokens: 4, outputTokens: 4 },
      }),
    },
  };

  srv = createProxyServer({ configDir: dir, profile: anthropicProfile(), port: 0, resolveHandler: async (n: string) => handlers[n] ?? null });
  const port = await srv.listen();

  const r = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
    method: "POST",
    body: JSON.stringify({ model: "claude-opus-4-1", max_tokens: 100, messages: [{ role: "user", content: "hello" }], stream: false }),
  });
  expect(r.status).toBe(200);
  const decoded = await translators.anthropic.decodeResponse(await r.text());
  expect(decoded.stopReason).toBe("end_turn");
  expect(decoded.content[0]).toMatchObject({ kind: "text", text: "ir front-door: hello" });
});
