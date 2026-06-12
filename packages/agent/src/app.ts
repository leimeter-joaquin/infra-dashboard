// SECURITY SURFACE: The agent executes OS commands. Read the security notes in each module.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AgentConfig } from './config';
import { tokenAuth } from './middleware/auth';
import { actionsRouter } from './routes/actions';
import { healthRouter } from './routes/health';

export function createApp(config: AgentConfig) {
  const app = new Hono();

  // CORS: only allow explicitly listed origins.
  // When the dashboard moves to the cloud, add that domain here — never use "*".
  app.use(
    '*',
    cors({
      origin: config.allowedOrigins,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // /health is public — the dashboard uses it to show whether the agent is reachable.
  app.route('/health', healthRouter());

  // All action routes require a valid token.
  app.use('/actions/*', tokenAuth(config.token));
  app.route('/actions', actionsRouter(config));

  return app;
}
