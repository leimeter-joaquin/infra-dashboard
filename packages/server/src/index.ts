import { serve } from '@hono/node-server';
import { createApp } from './app';
import { FileConfigRepository } from './repository/file-config-repository';
import { SERVER_PORT, CONFIG_PATH, ALLOWED_ORIGIN } from './config';

const repo = new FileConfigRepository(CONFIG_PATH);
const app = createApp(repo, ALLOWED_ORIGIN);

serve({ fetch: app.fetch, port: SERVER_PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`[server] listening on http://localhost:${info.port}`);
  console.log(`[server] config file: ${CONFIG_PATH}`);
});
