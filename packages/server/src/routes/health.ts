import { Hono } from 'hono';
import { HealthCheckRequestSchema } from '@infra-dashboard/shared';
import type { HealthCheckResult } from '@infra-dashboard/shared';

export function healthRouter() {
  const router = new Hono();

  router.post('/', async (c) => {
    const body = await c.req.json();
    const result = HealthCheckRequestSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }

    const { url } = result.data;
    const start = Date.now();

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      });
      const ms = Date.now() - start;
      const healthResult: HealthCheckResult = {
        // Any response (2xx, 3xx, 4xx) means the server is reachable.
        // Only connection failures / timeouts count as DOWN.
        up: true,
        status: response.status,
        ms,
      };
      return c.json(healthResult);
    } catch {
      const ms = Date.now() - start;
      const healthResult: HealthCheckResult = { up: false, status: null, ms };
      return c.json(healthResult);
    }
  });

  return router;
}
