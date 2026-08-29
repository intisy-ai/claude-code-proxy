import { describe, expect, it, vi } from "vitest";
import plugin from "./front-door-plugin.js";

// Mirrors the engine's own boundary, which reads the id off a typed key and accepts a bare id too.
function contextSpy() {
  const provided: Record<string, unknown> = {};
  const idOf = (key: unknown): string => (typeof key === "string" ? key : String((key as { id: string }).id));
  return {
    provided,
    context: { provide: vi.fn((key: unknown, value: unknown) => { provided[idOf(key)] = value; }) },
  };
}

describe("the claude-code-proxy front-door plugin", () => {
  it("provides exactly the front-door capability its manifest declares", async () => {
    const { context, provided } = contextSpy();
    await plugin.activate(context as never);
    expect(Object.keys(provided)).toEqual(["front-door"]);
  });

  it("offers the three wire methods a front-door owns", async () => {
    const { context, provided } = contextSpy();
    await plugin.activate(context as never);
    const capability = provided["front-door"] as Record<string, unknown>;
    expect(typeof capability.decode).toBe("function");
    expect(typeof capability.encode).toBe("function");
    expect(typeof capability.encodeError).toBe("function");
  });

  it("decodes this app's own wire request into IR", async () => {
    const { context, provided } = contextSpy();
    await plugin.activate(context as never);
    const capability = provided["front-door"] as { decode: (r: Request) => Promise<{ model?: string } | null> };
    const request = new Request("http://127.0.0.1/v1/messages", {
      method: "POST",
      body: JSON.stringify({ model: "claude-sonnet-5", messages: [{ role: "user", content: "hi" }], max_tokens: 16 }),
    });
    const ir = await capability.decode(request);
    expect(ir?.model).toBe("claude-sonnet-5");
  });

  it("answers null for a body that is not this app's wire format", async () => {
    const { context, provided } = contextSpy();
    await plugin.activate(context as never);
    const capability = provided["front-door"] as { decode: (r: Request) => Promise<unknown> };
    const request = new Request("http://127.0.0.1/v1/messages", { method: "POST", body: "not json" });
    await expect(capability.decode(request)).resolves.toBeNull();
  });

  it("deactivates without throwing", async () => {
    expect(plugin.deactivate()).toBeUndefined();
  });
});
