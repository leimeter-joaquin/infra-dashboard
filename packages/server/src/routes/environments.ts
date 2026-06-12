import { Hono } from 'hono';
import { CreateEnvironmentSchema, UpdateEnvironmentSchema } from '@infra-dashboard/shared';
import type { ConfigRepository } from '../repository/config-repository';

export function environmentsRouter(repo: ConfigRepository) {
  const router = new Hono();

  router.get('/', async (c) => {
    const config = await repo.getConfig();
    return c.json(config.environments);
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    const result = CreateEnvironmentSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }
    const config = await repo.getConfig();
    const env = {
      id: crypto.randomUUID(),
      name: result.data.name,
      createdAt: new Date().toISOString(),
    };
    config.environments.push(env);
    await repo.saveConfig(config);
    return c.json(env, 201);
  });

  router.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = UpdateEnvironmentSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }
    const config = await repo.getConfig();
    const idx = config.environments.findIndex((e) => e.id === id);
    if (idx === -1) {
      return c.json({ error: 'Environment not found' }, 404);
    }
    config.environments[idx] = { ...config.environments[idx], ...result.data };
    await repo.saveConfig(config);
    return c.json(config.environments[idx]);
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const config = await repo.getConfig();
    const exists = config.environments.some((e) => e.id === id);
    if (!exists) {
      return c.json({ error: 'Environment not found' }, 404);
    }
    config.environments = config.environments.filter((e) => e.id !== id);
    config.nodes = config.nodes.filter((n) => n.environmentId !== id);
    config.connections = config.connections.filter((conn) => conn.environmentId !== id);
    await repo.saveConfig(config);
    return c.json({ ok: true });
  });

  return router;
}
