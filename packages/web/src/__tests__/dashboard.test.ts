import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardStore } from '../store/dashboard';

vi.mock('../api/server-client', () => ({
  serverClient: {
    getConfig: vi.fn().mockResolvedValue({ environments: [], nodes: [], connections: [] }),
    createEnvironment: vi
      .fn()
      .mockImplementation((name: string) =>
        Promise.resolve({ id: 'env-new', name, createdAt: new Date().toISOString() })
      ),
    updateEnvironment: vi
      .fn()
      .mockImplementation((id: string, name: string) =>
        Promise.resolve({ id, name, createdAt: '' })
      ),
    deleteEnvironment: vi.fn().mockResolvedValue({ ok: true }),
    createNode: vi
      .fn()
      .mockImplementation((data: object) => Promise.resolve({ id: 'node-new', ...data })),
    updateNode: vi
      .fn()
      .mockImplementation((id: string, data: object) =>
        Promise.resolve({
          id,
          environmentId: 'env-1',
          name: 'n',
          description: '',
          url: 'http://x.com',
          position: { x: 0, y: 0 },
          ...data,
        })
      ),
    deleteNode: vi.fn().mockResolvedValue({ ok: true }),
    createConnection: vi
      .fn()
      .mockImplementation((data: object) => Promise.resolve({ id: 'conn-new', ...data })),
    deleteConnection: vi.fn().mockResolvedValue({ ok: true }),
    checkHealth: vi.fn().mockResolvedValue({ up: true, status: 200, ms: 42 }),
  },
}));

function resetStore() {
  useDashboardStore.setState({
    environments: [],
    nodes: [],
    connections: [],
    nodeStatuses: {},
    selectedEnvironmentId: null,
    agentToken: '',
    agentOnline: false,
    agentActions: [],
  });
}

describe('dashboard store', () => {
  beforeEach(resetStore);

  it('starts with empty state', () => {
    const state = useDashboardStore.getState();
    expect(state.environments).toHaveLength(0);
    expect(state.selectedEnvironmentId).toBeNull();
  });

  it('selectEnvironment sets selectedEnvironmentId', () => {
    useDashboardStore.getState().selectEnvironment('env-1');
    expect(useDashboardStore.getState().selectedEnvironmentId).toBe('env-1');
  });

  it('createEnvironment adds to environments', async () => {
    await useDashboardStore.getState().createEnvironment('staging');
    const { environments } = useDashboardStore.getState();
    expect(environments).toHaveLength(1);
    expect(environments[0].name).toBe('staging');
  });

  it('deleteEnvironment removes environment and its nodes/connections', async () => {
    useDashboardStore.setState({
      environments: [{ id: 'env-1', name: 'test', createdAt: '' }],
      nodes: [
        {
          id: 'n-1',
          environmentId: 'env-1',
          name: 'API',
          description: '',
          url: 'http://x.com',
          position: { x: 0, y: 0 },
        },
      ],
      connections: [{ id: 'c-1', environmentId: 'env-1', source: 'n-1', target: 'n-1' }],
      selectedEnvironmentId: 'env-1',
    });

    await useDashboardStore.getState().deleteEnvironment('env-1');

    const state = useDashboardStore.getState();
    expect(state.environments).toHaveLength(0);
    expect(state.nodes).toHaveLength(0);
    expect(state.connections).toHaveLength(0);
    expect(state.selectedEnvironmentId).toBeNull();
  });

  it('createNode adds to nodes', async () => {
    await useDashboardStore.getState().createNode({
      environmentId: 'env-1',
      name: 'API',
      description: '',
      url: 'http://localhost:8787',
      position: { x: 0, y: 0 },
    });
    expect(useDashboardStore.getState().nodes).toHaveLength(1);
  });

  it('deleteNode removes node and related connections', async () => {
    useDashboardStore.setState({
      nodes: [
        {
          id: 'n-1',
          environmentId: 'env-1',
          name: 'API',
          description: '',
          url: 'http://x.com',
          position: { x: 0, y: 0 },
        },
      ],
      connections: [{ id: 'c-1', environmentId: 'env-1', source: 'n-1', target: 'n-2' }],
    });

    await useDashboardStore.getState().deleteNode('n-1');

    expect(useDashboardStore.getState().nodes).toHaveLength(0);
    expect(useDashboardStore.getState().connections).toHaveLength(0);
  });

  it('checkNodeStatus sets status on success', async () => {
    useDashboardStore.setState({
      nodes: [
        {
          id: 'n-1',
          environmentId: 'env-1',
          name: 'API',
          description: '',
          url: 'http://x.com',
          position: { x: 0, y: 0 },
        },
      ],
    });

    await useDashboardStore.getState().checkNodeStatus('n-1');

    const status = useDashboardStore.getState().nodeStatuses['n-1'];
    expect(status.up).toBe(true);
    expect(status.checking).toBe(false);
  });
});
