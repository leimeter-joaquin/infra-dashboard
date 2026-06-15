// SECURITY SURFACE: this router executes whitelisted OS commands.
// The whitelist is enforced by ID lookup — no raw command strings ever come from the client.
import { Hono } from 'hono';
import type { AgentConfig } from '../config';
import { executeCommand, spawnDetached, stopProcess, isRunning } from '../runner';

export function actionsRouter(config: AgentConfig) {
  const router = new Hono();

  router.get('/', (c) => {
    // Expose only id + description (+ detached/running state) — never expose cmd or args.
    const actions = config.actions.map(({ id, description, detached }) => ({
      id,
      description,
      detached,
      running: isRunning(id),
    }));
    return c.json(actions);
  });

  router.post('/:id/run', async (c) => {
    const id = c.req.param('id');
    const action = config.actions.find((a) => a.id === id);

    if (!action) {
      console.warn(`[agent] ${new Date().toISOString()} REJECTED unknown action id="${id}"`);
      return c.json({ error: `Action "${id}" is not in the whitelist` }, 404);
    }

    console.log(
      `[agent] ${new Date().toISOString()} EXECUTING action id="${action.id}" cmd="${action.cmd}"`
    );

    if (action.detached) {
      const result = spawnDetached(action.id, action.cmd, action.args, action.cwd);
      console.log(`[agent] ${new Date().toISOString()} STARTED id="${action.id}" ok=${result.ok}`);
      return c.json(result, result.ok ? 200 : 409);
    }

    const result = await executeCommand(action.cmd, action.args);
    console.log(
      `[agent] ${new Date().toISOString()} RESULT id="${action.id}" ok=${result.ok} exitCode=${result.exitCode}`
    );

    return c.json(result, result.ok ? 200 : 500);
  });

  router.post('/:id/stop', (c) => {
    const id = c.req.param('id');
    const action = config.actions.find((a) => a.id === id);

    if (!action) {
      console.warn(`[agent] ${new Date().toISOString()} REJECTED unknown action id="${id}"`);
      return c.json({ error: `Action "${id}" is not in the whitelist` }, 404);
    }
    if (!action.detached) {
      return c.json({ error: `Action "${id}" is not a detached (stoppable) action` }, 400);
    }

    const result = stopProcess(action.id);
    console.log(`[agent] ${new Date().toISOString()} STOPPED id="${action.id}" ok=${result.ok}`);
    return c.json({ ok: result.ok, message: result.stderr || 'stopped' }, result.ok ? 200 : 409);
  });

  return router;
}
