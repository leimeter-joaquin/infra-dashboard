// This client talks DIRECTLY to the local agent process (http://127.0.0.1:4322).
// When the dashboard moves to the cloud, the server client URL changes but this one stays local.
import type { AgentActionInfo, AgentActionResult } from '@infra-dashboard/shared';

const AGENT_BASE = 'http://127.0.0.1:4322';

export const agentClient = {
  // Check if the agent process is running.
  ping: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AGENT_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  listActions: (token: string) =>
    fetch(`${AGENT_BASE}/actions`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json() as Promise<AgentActionInfo[]>),

  runAction: async (id: string, token: string): Promise<AgentActionResult> => {
    const res = await fetch(`${AGENT_BASE}/actions/${id}/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json() as Promise<AgentActionResult>;
  },
};
