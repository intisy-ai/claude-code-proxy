// A home deploys the manifest's entry as ONE file, `<home>/plugin/<id>.js`. So the entry may carry
// no relative import: `./profiles/anthropic.js` beside it in dist resolves to nothing beside it
// there, and the plugin cannot activate. It shipped that way until 2026-08-28, which is why this is
// a test rather than a note.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(readFileSync(new URL("../../plugin.json", import.meta.url), "utf-8")) as { entry: string };
const entry = readFileSync(fileURLToPath(new URL("../../" + manifest.entry, import.meta.url)), "utf-8");

describe("the deployed plugin entry", () => {
  it("carries no relative import, because it is deployed alone", () => {
    const relative = entry.match(/(?:from|import)\s*\(?\s*["'](\.[^"']*)["']/g) ?? [];
    expect(relative).toEqual([]);
  });

  it("still imports its libraries bare, so the home's shared store resolves them", () => {
    expect(entry).toContain('"@intisy-ai/core-proxy"');
  });
});
