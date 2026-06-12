// SECURITY SURFACE: every request to the agent must pass through this middleware.
// The token must match the one configured in agent.config.json or AGENT_TOKEN env var.
import type { MiddlewareHandler } from 'hono';

export function tokenAuth(token: string): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${token}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  };
}
