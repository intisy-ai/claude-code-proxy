// Proves serveDirect (the no-daemon transport) produces the same wire Response the daemon route
// produces for the same input, over the same anthropic profile + translator.
import { expect, it } from "vitest";
import { serveDirect } from "./serve-direct.js";
import { anthropicTranslator } from "@intisy-ai/anthropic-translator";
import type { IrRequest, IrResponse } from "@intisy-ai/core-ir";

const wire = JSON.stringify({ model: "claude-opus-4-1", max_tokens: 16, messages: [{ role: "user", content: "ping" }] });
const ctx = { configDir: "/tmp", log: () => {}, model: "m-ok", provider: "p" } as any;

it("decodes app wire -> IR, calls the injected handleIr, and encodes back to app wire", async () => {
  const handleIr = async (ir: IrRequest): Promise<IrResponse> => ({
    id: "msg_1", model: "m-ok",
    content: [{ kind: "text", text: "echo: " + ((ir.messages[0]?.content[0] as any)?.text ?? "") }],
    stopReason: "end_turn", usage: { inputTokens: 1, outputTokens: 1 },
  });
  const res = await serveDirect(new Request("http://x/v1/messages", { method: "POST", body: wire }), handleIr, ctx);
  expect(res.status).toBe(200);
  const decoded = await anthropicTranslator.decodeResponse(await res.text());
  expect(decoded.content[0]).toMatchObject({ kind: "text", text: "echo: ping" });
});
