import { Hono } from 'hono';

export function healthRouter() {
  const router = new Hono();
  router.get('/', (c) => c.json({ ok: true, service: 'agent' }));
  return router;
}
