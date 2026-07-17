#!/usr/bin/env node
// Post-tsc step: tsc does not copy plain .js files, but the runtime `import("../generated/...")`
// in dist must resolve to the TeaVM-transpiled JS that the teavm-build.mjs stage produced under
// src/generated/. Copy it (and its sourcemap, if present) into dist/generated/ verbatim.
import { existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const srcDir = "src/generated";
const outDir = "dist/generated";

mkdirSync(outDir, { recursive: true });

if (existsSync(srcDir)) {
  for (const file of readdirSync(srcDir)) {
    if (file.endsWith(".js") || file.endsWith(".js.map")) {
      copyFileSync(join(srcDir, file), join(outDir, file));
      console.log(`build.mjs: copied ${join(srcDir, file)} -> ${join(outDir, file)}`);
    }
  }
}
