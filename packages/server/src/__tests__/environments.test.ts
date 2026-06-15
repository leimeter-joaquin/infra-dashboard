import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../app';
import type { ConfigRepository } from '../repository/config-repository';
import type { Config } from '@infra-dashboard/shared';

function makeMockRepo(initial: Partial<Config> = {}): ConfigRepository {
  let config: Config = {
    environments: initial.environments ?? [],
    nodes: initial.nodes ?? [],
    connections: initial.connections ?? [],
  };
  return {
    getConfig: vi.fn().mockImplementation(() => Promise.resolve(structuredClone(config))),
    saveConfig: vi.fn().mockImplementation((c: Config) => {
      config = structuredClone(c);
      return Promise.resolve();
    }),
  };
}

describe('GET /api/environments', () => {
  it('returns empty array initially', async () => {
    const app = createApp(makeMockRepo());
    const res = await app.request('/api/environments');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe('POST /api/environments', () => {
  let repo: ConfigRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repo = makeMockRepo();
    app = createApp(repo);
  });

  it('creates an environment', async () => {
    const res = await app.request('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'local' }),
    });
    expect(res.status).toBe(201);
    const env = (await res.json()) as { name: string; id: string; createdAt: string };
    expect(env.name).toBe('local');
    expect(env.id).toBeDefined();
    expect(env.createdAt).toBeDefined();
  });

  it('rejects empty name', async () => {
    const res = await app.request('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects missing name', async () => {
    const res = await app.request('/api/environments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/environments/:id', () => {
  it('removes environment and cascades to nodes and connections', async () => {
    const repo = makeMockRepo({
      environments: [{ id: 'env-1', name: 'test', createdAt: '' }],
      nodes: [
        {
          id: 'n-1',
          environmentId: 'env-1',
          name: 'API',
          description: '',
          url: 'http://localhost',
          position: { x: 0, y: 0 },
        },
      ],
      connections: [{ id: 'c-1', environmentId: 'env-1', source: 'n-1', target: 'n-1' }],
    });
    const app = createApp(repo);

    const res = await app.request('/api/environments/env-1', { method: 'DELETE' });
    expect(res.status).toBe(200);

    const config = await repo.getConfig();
    expect(config.environments).toHaveLength(0);
    expect(config.nodes).toHaveLength(0);
    expect(config.connections).toHaveLength(0);
  });

  it('returns 404 for unknown id', async () => {
    const app = createApp(makeMockRepo());
    const res = await app.request('/api/environments/nope', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/environments/:id', () => {
  it('updates environment name', async () => {
    const repo = makeMockRepo({
      environments: [{ id: 'env-1', name: 'old', createdAt: '' }],
    });
    const app = createApp(repo);

    const res = await app.request('/api/environments/env-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'new' }),
    });
    expect(res.status).toBe(200);
    const env = (await res.json()) as { name: string };
    expect(env.name).toBe('new');
  });
});
