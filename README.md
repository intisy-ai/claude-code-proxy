# claude-code-proxy

The Claude/Anthropic proxy layer on top of the generic `core-proxy` engine.
It provides `anthropicProfile` — the config filename, tier order/fallback,
tier regex, env-var prefix, default context/output limits, and the native
Anthropic-shaped 429 response that the engine needs to route requests for
Claude Code. It is consumed by `claude-code-loader` as a git submodule and
installed/run by the dashboard sidecar.

This is a **library repo consumed as a git submodule and bundled from
source** (the same treatment as `core` / `core-auth` / `core-loader` /
`core-proxy`) — it is not published to npm.

This project carries **no generic engine code** — the routing engine
(`:34567` daemon, tier→provider chains, rate-limit fallback, model rewrite,
the node↔web request adapter) lives entirely in `core-proxy`, nested here as
a submodule. `claude-code-proxy` only supplies the Claude-specific profile
that parameterizes that engine.

## Structure

- `core-proxy/` — the generic routing engine, nested as a git submodule
  (compiled separately into `core-proxy/dist`, excluded from this project's
  own `tsconfig.json`).
- `src/profiles/anthropic.ts` — `anthropicProfile()`, the Anthropic
  `RoutingProfile` (config file, tier order/fallback, tier regex, env
  prefix, default context/output, `nativeRateLimit`).
- `src/index.ts` — the public barrel: re-exports the entire `core-proxy` API
  plus `anthropicProfile`, so consumers import everything from one place.
- `dist/` — compiled output (gitignored, never committed).

## Usage

```ts
import { createProxyServer, makeDynamicResolver, anthropicProfile } from "./claude-code-proxy/dist/index.js";

const profile = anthropicProfile();
const resolveHandler = makeDynamicResolver(() =>
  listProviders().map((p) => ({ provider: p.provider, handlerPath: p.handlerPath }))
);
const server = createProxyServer({ configDir, profile, port: 34567, resolveHandler });
await server.listen();
```

## Testing

`npm run build && npx vitest run` — builds the nested `core-proxy` engine
first, then this project's own `src`, then runs the moved `anthropicProfile`
tests plus a barrel smoke test asserting the re-exported surface.

## License

MIT
