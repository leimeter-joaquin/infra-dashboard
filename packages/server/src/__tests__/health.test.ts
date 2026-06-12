import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../app';
import { makeMockRepo } from './test-helpers';

interface HealthData { up: boolean; status: number | null; ms: number }

describe('POST /api/health', () => {
  const app = createApp(makeMockRepo());

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns up=true when server responds with any status code', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('ok', { status: 200 }));

    const res = await app.request('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://example.com' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json() as HealthData;
    expect(data.up).toBe(true);
    expect(data.status).toBe(200);
    expect(typeof data.ms).toBe('number');
  });

  it('returns up=true for 404 responses (server is reachable)', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('not found', { status: 404 }));

    const res = await app.request('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://example.com/missing' }),
    });

    const data = await res.json() as HealthData;
    expect(data.up).toBe(true);
    expect(data.status).toBe(404);
  });

  it('returns up=false when fetch throws (connection refused)', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));

    const res = await app.request('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://example.com' }),
    });

    const data = await res.json() as HealthData;
    expect(data.up).toBe(false);
    expect(data.status).toBeNull();
  });

  it('returns 400 for invalid URL', async () => {
    const res = await app.request('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'not-a-url' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing url field', async () => {
    const res = await app.request('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
