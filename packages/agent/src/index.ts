import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadConfig, AGENT_PORT } from './config';

const config = loadConfig();
const app = createApp(config);

// The agent binds to 127.0.0.1 only — it must never be exposed to the network.
serve({ fetch: app.fetch, port: AGENT_PORT, hostname: '127.0.0.1' }, (info) => {
  console.log(`[agent] listening on http://127.0.0.1:${info.port}`);
  console.log(`[agent] ${config.actions.length} action(s) in whitelist`);
});
