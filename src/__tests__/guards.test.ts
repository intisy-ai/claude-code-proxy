import { guardDocumentation, guardGeneratedSurface, guardNoSuppressions } from "@intisy/bayonet/testing";

guardDocumentation({ dir: new URL("..", import.meta.url) });
guardNoSuppressions({ dir: new URL("..", import.meta.url) });
guardGeneratedSurface({
  files: [new URL("../generated/anthropic-rate-limit.teavm.d.ts", import.meta.url)],
});
