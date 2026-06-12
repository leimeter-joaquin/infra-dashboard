import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const ActionSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  cmd: z.string().min(1),
  args: z.array(z.string()),
});

const AgentConfigSchema = z.object({
  token: z.string().min(1),
  allowedOrigins: z.array(z.string()),
  actions: z.array(ActionSchema),
});

export type AgentAction = z.infer<typeof ActionSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export const AGENT_PORT = Number(process.env.AGENT_PORT ?? 4322);

export function loadConfig(): AgentConfig {
  const configPath = process.env.AGENT_CONFIG_PATH ?? join(process.cwd(), 'agent.config.json');
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (err) {
    throw new Error(
      `[agent] Cannot read config at ${configPath}. Copy agent.config.example.json to agent.config.json and fill in your values.\n${err}`
    );
  }
  const result = AgentConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`[agent] Invalid config: ${result.error.message}`);
  }
  // Env var overrides config file token (recommended for production use)
  if (process.env.AGENT_TOKEN) {
    result.data.token = process.env.AGENT_TOKEN;
  }
  return result.data;
}
