# Infra Dashboard

A local-first dashboard to monitor and control development environments.

## Architecture

The system is split into three independent services that communicate over HTTP:

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (localhost:3000)                  │
│                      /packages/web                            │
│                   React + React Flow                          │
└───────────────┬────────────────────────┬────────────────────┘
                │ /api/* (proxied)        │ direct (127.0.0.1)
                ▼                         ▼
┌──────────────────────────┐  ┌─────────────────────────────┐
│  Server  (port 4321)      │  │  Agent  (port 4322)          │
│  /packages/server         │  │  /packages/agent             │
│  Hono + Node.js           │  │  Hono + Node.js              │
│                           │  │                              │
│  - CRUD config/envs/nodes │  │  - Executes LOCAL commands   │
│  - Health checks (server- │  │  - Whitelist only (by ID)    │
│    side fetch, no CORS)   │  │  - Token auth required       │
│  - Reads config.json      │  │  - Binds to 127.0.0.1 only   │
│                           │  │  - Reads agent.config.json   │
│  Cloud-ready: this is the │  │                              │
│  piece that moves to a    │  │  Always runs on your machine │
│  Worker / cloud host.     │  │  regardless of where web/    │
└──────────────────────────┘  │  server live.                │
                               └─────────────────────────────┘
```

**Why three services?** The server holds config and does health checks — it's cloud-portable. The agent executes OS commands — it MUST stay local. The web talks to both. When you move the server to Cloudflare Workers, you only change a URL; the agent and its security contract don't change.

## Requirements

- Node.js 18+
- pnpm 8+

## Installation

```bash
cp config.example.json config.json           # server config (edit as needed)
cp agent.config.example.json packages/agent/agent.config.json  # agent config

# Install all dependencies
pnpm install
```

## Agent token setup

The agent requires a shared secret to authorize requests from the dashboard.

**Option A — config file (development):**
Edit `packages/agent/agent.config.json` and set a real value for `token`.

**Option B — environment variable (recommended for any shared setup):**
```bash
export AGENT_TOKEN=your-strong-secret-here
```
The env var takes precedence over the config file value.

The web dashboard has a "Agent token" field in the header — paste the same secret there to enable running actions.

## Running in development

Starts all three services in parallel:

```bash
pnpm dev
```

| Service | URL                      | Config file         |
|---------|--------------------------|---------------------|
| Web     | http://localhost:3000     | vite.config.ts      |
| Server  | http://localhost:4321     | config.json         |
| Agent   | http://127.0.0.1:4322    | agent.config.json   |

The web Vite dev server proxies `/api/*` requests to the server (port 4321). Agent calls go directly from the browser to `127.0.0.1:4322`.

## Running tests

```bash
# All unit/integration tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests (requires all three services running)
pnpm test:e2e

# Type-check all packages
pnpm typecheck
```

## Ports

| Service | Port | Note                                      |
|---------|------|-------------------------------------------|
| Web     | 3000 | Vite dev server                           |
| Server  | 4321 | Override with SERVER_PORT env var         |
| Agent   | 4322 | Override with AGENT_PORT env var          |

Ports 5173 (your FE) and 8787 (your Worker) are intentionally avoided.

## Adding agent actions

Edit `packages/agent/agent.config.json`:

```json
{
  "token": "your-secret",
  "allowedOrigins": ["http://localhost:3000"],
  "actions": [
    {
      "id": "open-editor",
      "description": "Open project in VS Code",
      "cmd": "code",
      "args": ["/path/to/your/project"]
    }
  ]
}
```

The dashboard can only trigger actions by `id` — the raw `cmd` and `args` are never sent to the client.

## Future: moving the server to the cloud

1. Deploy `/packages/server` to Cloudflare Workers (it's already Hono — swap `@hono/node-server` for the Workers adapter).
2. Set `VITE_SERVER_BASE_URL=https://your-worker.workers.dev` in the web package.
3. Update `packages/web/src/api/server-client.ts` to use the env var.
4. Add the new web origin to the agent's `allowedOrigins` in `agent.config.json`.
5. Done — the agent doesn't change.
