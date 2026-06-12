import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ConfigRepository } from './repository/config-repository';
import { configRouter } from './routes/config';
import { environmentsRouter } from './routes/environments';
import { nodesRouter } from './routes/nodes';
import { connectionsRouter } from './routes/connections';
import { healthRouter } from './routes/health';

export function createApp(repo: ConfigRepository, allowedOrigin: string = 'http://localhost:3000') {
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: allowedOrigin,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
    })
  );

  app.route('/api/config', configRouter(repo));
  app.route('/api/environments', environmentsRouter(repo));
  app.route('/api/nodes', nodesRouter(repo));
  app.route('/api/connections', connectionsRouter(repo));
  app.route('/api/health', healthRouter());

  app.get('/api/ping', (c) => c.json({ ok: true }));

  return app;
}
