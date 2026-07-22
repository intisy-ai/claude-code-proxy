import { expect, it, describe } from "vitest";
import { createProxyServer, makeDynamicResolver, resolveModelMap, anthropicProfile, isValidProfile, proxyDef } from "./index.js";

it("barrel: re-exports both the core-proxy engine and the anthropic profile", () => {
  expect(typeof createProxyServer).toBe("function");
  expect(typeof makeDynamicResolver).toBe("function");
  expect(typeof resolveModelMap).toBe("function");
  expect(isValidProfile(anthropicProfile())).toBe(true);
});

describe("proxyDef", () => {
  it("exports the standardized plugin descriptor", () => {
    expect(proxyDef.app).toBe("claude");
    expect(proxyDef.label).toBe("Claude Code");
    expect(typeof proxyDef.profile).toBe("function");
    expect(proxyDef.profile().tierOrder.length).toBeGreaterThan(0);
  });
});
