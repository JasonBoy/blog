---
title: 'Intro to msw-mcp: AI-Driven API Mocking with MSW'
description: >-
  A practical introduction to msw-mcp, what problems it solves, and how it
  connects AI assistants with Mock Service Worker for real-time API mocking.
pubDate: '2026-04-07'
heroImage: /intro-to-msw-mcp.webp
tags:
  - msw
  - mcp
  - mocking
  - api-testing
  - javascript
---

When frontend work depends on unstable backend APIs, development slows down fast. You wait for endpoints, patch temporary mocks, and keep rewriting them when requirements change.

That is exactly the gap **msw-mcp** is trying to close.

[msw-mcp](https://github.com/JasonBoy/msw-mcp) is an MCP server that lets AI assistants control [Mock Service Worker](https://mswjs.io/) in the browser. In plain words: you describe the API behavior you want, the assistant generates MSW handlers, and the mocks are applied in real time.

Chinese version: [简体中文](/blog/zh/intro-to-msw-mcp-ai-driven-api-mocking-zh_cn/)

## What problem does it solve?

Most teams already use MSW, but the daily workflow still has friction:

- Writing and editing handlers manually for every new endpoint
- Restarting or refreshing repeatedly when mock behavior changes
- Spending time wiring edge cases (500 errors, delays, one-time failures)
- Keeping mocks aligned while backend contracts are still evolving

`msw-mcp` keeps MSW as the runtime, but adds an AI control layer on top. You can create, update, remove, or reset handlers quickly through MCP tools, without manually touching mock files for every change.

## How it works

At a high level, the flow looks like this:

1. You ask the AI assistant for an API behavior.
2. The assistant calls an MCP tool such as `msw_add_handlers`.
3. `msw-mcp` server receives the request and forwards it over WebSocket.
4. The browser-side `msw-mcp/client` bridge applies the new handlers to MSW.
5. Next matching HTTP requests are intercepted by those handlers.

So the architecture is:

- AI Assistant <-> MCP Protocol <-> msw-mcp server <-> WebSocket <-> Browser MSW worker

Because updates are pushed through WebSocket, you can iterate on mock behavior quickly during development.

## Quick setup

For most cases, the fastest MCP config is:

```json
{
  "mcpServers": {
    "msw-mcp": {
      "command": "npx",
      "args": ["msw-mcp@latest"]
    }
  }
}
```

Then run the prompt in your MCP client:

```text
/msw-setup
```

This prompt does more than a basic scaffold. It inspects your project and adapts setup based on your stack.

### What `/msw-setup` supports

Build tools it can detect:

- Vite (`vite.config.js/ts`)
- Rspack (`rspack.config.js`)
- Rsbuild (`rsbuild.config.js/ts`)
- Webpack (`webpack.config.js`)

It also reads bundler public path settings (`base`, `publicPath`, `assetPrefix`) and builds the correct service worker URL, such as `/app/mockServiceWorker.js` instead of always assuming `/mockServiceWorker.js`.

### What files and patterns it generates

In a new project, it creates a full `mocks/` structure and chooses `.ts` or `.js` based on TypeScript detection:

- `mocks/handlers.{js|ts}`: base handlers
- `mocks/browser.{js|ts}`: MSW worker setup
- `mocks/index.{js|ts}`: bridge initialization with `msw-mcp/client`
- `mocks/types.d.ts`: TS-only window typing
- `mocks/custom-handlers/index.example.{js|ts}`: sample local handlers
- `mocks/custom-handlers/index.{js|ts}`: local-only handlers (gitignored)

It also initializes `mockServiceWorker.js` in the detected public directory, updates `.env`/`.env.local`, and adds bundler-side env exposure so frontend code can read mock flags.

For existing `mocks/` setups, it uses migration mode: keeps your existing handlers, updates integration to use `msw-mcp/client`, and avoids rewriting your actual API mock definitions.

If you prefer manual integration, install dependencies and enable the client bridge:

```bash
npm install -D msw msw-mcp
npx msw init public/ --save
```

```javascript
import { enableMocking } from 'msw-mcp/client';
import { setupWorker } from 'msw/browser';

const worker = setupWorker();

await enableMocking({
  worker,
  wsEnabled: true,
  wsBridgeOptions: { url: 'ws://localhost:6789' },
});
```

## Typical workflows

Once running, common assistant requests are very direct:

- "Create a GET /users endpoint that returns a list"
- "Make /users return 500 for testing error UI"
- "Update /users response to include an updated flag"
- "Reset handlers to clean state"

Behind the scenes, these map to the core tools:

- `msw_add_handlers`
- `msw_update_handlers`
- `msw_remove_handlers`
- `msw_reset_handlers`
- `msw_get_status`

That gives you a practical loop: describe -> apply -> test UI -> adjust.

## Practical notes before you use it

A few details matter in real projects:

- **Handler order is important**: in MSW, first matching handler wins.
- **Specific before general**: put concrete routes before wildcard or generic routes.
- **Use one-time handlers for edge cases**: `once: true` is useful for first-request failures.
- **Persistence is optional**: `--persist-handlers` keeps handlers across refreshes.
- **Method-aware updates help**: use method filters when GET/POST share route patterns.

Useful flags include:

- `--mock-ws-port=6789`
- `--persist-handlers` or `--persist-handlers=10`
- `--single-client`

## Final thoughts

`msw-mcp` is not a replacement for MSW. It is a productivity layer around MSW for teams that already value mock-driven development but want faster iteration.

If your team frequently prototypes APIs, tests many UI states, or works in parallel with backend changes, this can reduce mock maintenance cost and make local development more predictable.

The biggest value is simple: you stay in a tight feedback loop, and your mocks evolve as fast as your product ideas.

Happy Mocking! 🤡
