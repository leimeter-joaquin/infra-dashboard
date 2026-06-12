import { Hono } from 'hono';
import { ConfigSchema } from '@infra-dashboard/shared';
import type { ConfigRepository } from '../repository/config-repository';

export function configRouter(repo: ConfigRepository) {
  const router = new Hono();

  router.get('/', async (c) => {
    const config = await repo.getConfig();
    return c.json(config);
  });

  router.put('/', async (c) => {
    const body = await c.req.json();
    const result = ConfigSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }
    await repo.saveConfig(result.data);
    return c.json(result.data);
  });

  return router;
}
