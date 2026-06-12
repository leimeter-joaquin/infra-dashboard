import { Hono } from 'hono';
import { CreateConnectionSchema } from '@infra-dashboard/shared';
import type { ConfigRepository } from '../repository/config-repository';

export function connectionsRouter(repo: ConfigRepository) {
  const router = new Hono();

  router.get('/', async (c) => {
    const environmentId = c.req.query('environmentId');
    const config = await repo.getConfig();
    const connections = environmentId
      ? config.connections.filter((conn) => conn.environmentId === environmentId)
      : config.connections;
    return c.json(connections);
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    const result = CreateConnectionSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }
    const config = await repo.getConfig();
    const connection = { id: crypto.randomUUID(), ...result.data };
    config.connections.push(connection);
    await repo.saveConfig(config);
    return c.json(connection, 201);
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const config = await repo.getConfig();
    const exists = config.connections.some((conn) => conn.id === id);
    if (!exists) {
      return c.json({ error: 'Connection not found' }, 404);
    }
    config.connections = config.connections.filter((conn) => conn.id !== id);
    await repo.saveConfig(config);
    return c.json({ ok: true });
  });

  return router;
}
