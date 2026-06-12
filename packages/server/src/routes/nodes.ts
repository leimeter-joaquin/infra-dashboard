import { Hono } from 'hono';
import { CreateNodeSchema, UpdateNodeSchema } from '@infra-dashboard/shared';
import type { ConfigRepository } from '../repository/config-repository';

export function nodesRouter(repo: ConfigRepository) {
  const router = new Hono();

  router.get('/', async (c) => {
    const environmentId = c.req.query('environmentId');
    const config = await repo.getConfig();
    const nodes = environmentId
      ? config.nodes.filter((n) => n.environmentId === environmentId)
      : config.nodes;
    return c.json(nodes);
  });

  router.post('/', async (c) => {
    const body = await c.req.json();
    const result = CreateNodeSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }
    const config = await repo.getConfig();
    const envExists = config.environments.some((e) => e.id === result.data.environmentId);
    if (!envExists) {
      return c.json({ error: 'Environment not found' }, 404);
    }
    const node = { id: crypto.randomUUID(), ...result.data };
    config.nodes.push(node);
    await repo.saveConfig(config);
    return c.json(node, 201);
  });

  router.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = UpdateNodeSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }
    const config = await repo.getConfig();
    const idx = config.nodes.findIndex((n) => n.id === id);
    if (idx === -1) {
      return c.json({ error: 'Node not found' }, 404);
    }
    config.nodes[idx] = { ...config.nodes[idx], ...result.data };
    await repo.saveConfig(config);
    return c.json(config.nodes[idx]);
  });

  router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const config = await repo.getConfig();
    const exists = config.nodes.some((n) => n.id === id);
    if (!exists) {
      return c.json({ error: 'Node not found' }, 404);
    }
    config.nodes = config.nodes.filter((n) => n.id !== id);
    config.connections = config.connections.filter(
      (conn) => conn.source !== id && conn.target !== id
    );
    await repo.saveConfig(config);
    return c.json({ ok: true });
  });

  return router;
}
