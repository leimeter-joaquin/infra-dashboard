import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../app';
import type { AgentConfig } from '../config';

const mockConfig: AgentConfig = {
  token: 'test-secret',
  allowedOrigins: ['http://localhost:3000'],
  actions: [
    { id: 'open-editor', description: 'Open editor', cmd: 'code', args: ['.'], detached: false },
    { id: 'echo-hello', description: 'Echo hello', cmd: 'echo', args: ['hello'], detached: false },
    {
      id: 'dev-server',
      description: 'Run dev server',
      cmd: 'npm',
      args: ['run', 'dev'],
      detached: true,
    },
  ],
};

vi.mock('../runner', () => ({
  executeCommand: vi.fn().mockResolvedValue({
    ok: true,
    stdout: 'done',
    stderr: '',
    exitCode: 0,
  }),
  spawnDetached: vi.fn().mockReturnValue({ ok: true, stdout: '', stderr: '', exitCode: null }),
  stopProcess: vi.fn().mockReturnValue({ ok: true, stdout: '', stderr: '', exitCode: null }),
  isRunning: vi.fn().mockReturnValue(false),
}));

const AUTH = { Authorization: 'Bearer test-secret' };

describe('GET /health', () => {
  it('responds without auth', async () => {
    const app = createApp(mockConfig);
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
  });
});

describe('GET /actions', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    app = createApp(mockConfig);
  });

  it('returns action list with id, description, detached and running state', async () => {
    const res = await app.request('/actions', { headers: AUTH });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{
      id: string;
      description: string;
      detached: boolean;
      running: boolean;
      cmd?: string;
      args?: string[];
    }>;
    expect(data).toHaveLength(3);
    expect(data[0]).toEqual({
      id: 'open-editor',
      description: 'Open editor',
      detached: false,
      running: false,
    });
    // cmd and args must NOT be exposed
    expect(data[0].cmd).toBeUndefined();
    expect(data[0].args).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await app.request('/actions');
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong token', async () => {
    const res = await app.request('/actions', {
      headers: { Authorization: 'Bearer wrong' },
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /actions/:id/run', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    app = createApp(mockConfig);
  });

  it('executes a whitelisted action', async () => {
    const res = await app.request('/actions/open-editor/run', {
      method: 'POST',
      headers: AUTH,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
  });

  it('returns 404 for an action not in the whitelist', async () => {
    const res = await app.request('/actions/rm-rf/run', {
      method: 'POST',
      headers: AUTH,
    });
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('whitelist');
  });

  it('returns 401 without token', async () => {
    const res = await app.request('/actions/open-editor/run', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong token', async () => {
    const res = await app.request('/actions/open-editor/run', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    expect(res.status).toBe(401);
  });

  it('spawns detached actions without waiting for them to exit', async () => {
    const res = await app.request('/actions/dev-server/run', {
      method: 'POST',
      headers: AUTH,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; exitCode: number | null };
    expect(data.ok).toBe(true);
    expect(data.exitCode).toBeNull();
  });
});

describe('POST /actions/:id/stop', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    app = createApp(mockConfig);
  });

  it('stops a detached action', async () => {
    const res = await app.request('/actions/dev-server/stop', {
      method: 'POST',
      headers: AUTH,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
  });

  it('rejects stopping a non-detached action', async () => {
    const res = await app.request('/actions/open-editor/stop', {
      method: 'POST',
      headers: AUTH,
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for an action not in the whitelist', async () => {
    const res = await app.request('/actions/rm-rf/stop', {
      method: 'POST',
      headers: AUTH,
    });
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await app.request('/actions/dev-server/stop', { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
