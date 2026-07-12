import { expect, it } from "vitest";
import { createProxyServer, makeDynamicResolver, resolveModelMap, anthropicProfile, isValidProfile } from "./index.js";

it("barrel: re-exports both the core-proxy engine and the anthropic profile", () => {
  expect(typeof createProxyServer).toBe("function");
  expect(typeof makeDynamicResolver).toBe("function");
  expect(typeof resolveModelMap).toBe("function");
  expect(isValidProfile(anthropicProfile())).toBe(true);
});
