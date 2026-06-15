import type {
  Config,
  Environment,
  NodeConfig,
  Connection,
  HealthCheckResult,
} from '@infra-dashboard/shared';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const serverClient = {
  getConfig: () => request<Config>('/config'),

  createEnvironment: (name: string) =>
    request<Environment>('/environments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  updateEnvironment: (id: string, name: string) =>
    request<Environment>(`/environments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  deleteEnvironment: (id: string) =>
    request<{ ok: boolean }>(`/environments/${id}`, { method: 'DELETE' }),

  createNode: (data: Omit<NodeConfig, 'id'>) =>
    request<NodeConfig>('/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNode: (id: string, data: Partial<Omit<NodeConfig, 'id' | 'environmentId'>>) =>
    request<NodeConfig>(`/nodes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteNode: (id: string) => request<{ ok: boolean }>(`/nodes/${id}`, { method: 'DELETE' }),

  createConnection: (data: Omit<Connection, 'id'>) =>
    request<Connection>('/connections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteConnection: (id: string) =>
    request<{ ok: boolean }>(`/connections/${id}`, { method: 'DELETE' }),

  checkHealth: (url: string) =>
    request<HealthCheckResult>('/health', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
};
