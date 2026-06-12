// SECURITY SURFACE: this router executes whitelisted OS commands.
// The whitelist is enforced by ID lookup — no raw command strings ever come from the client.
import { Hono } from 'hono';
import type { AgentConfig } from '../config';
import { executeCommand } from '../runner';

export function actionsRouter(config: AgentConfig) {
  const router = new Hono();

  router.get('/', (c) => {
    // Expose only id + description — never expose cmd or args to clients.
    const actions = config.actions.map(({ id, description }) => ({ id, description }));
    return c.json(actions);
  });

  router.post('/:id/run', async (c) => {
    const id = c.req.param('id');
    const action = config.actions.find((a) => a.id === id);

    if (!action) {
      console.warn(`[agent] ${new Date().toISOString()} REJECTED unknown action id="${id}"`);
      return c.json({ error: `Action "${id}" is not in the whitelist` }, 404);
    }

    console.log(`[agent] ${new Date().toISOString()} EXECUTING action id="${action.id}" cmd="${action.cmd}"`);
    const result = await executeCommand(action.cmd, action.args);
    console.log(
      `[agent] ${new Date().toISOString()} RESULT id="${action.id}" ok=${result.ok} exitCode=${result.exitCode}`
    );

    return c.json(result, result.ok ? 200 : 500);
  });

  return router;
}
