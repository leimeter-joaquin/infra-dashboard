import { create } from 'zustand';
import type { Environment, NodeConfig, Connection, AgentActionInfo } from '@infra-dashboard/shared';
import { serverClient } from '../api/server-client';
import { agentClient } from '../api/agent-client';

export interface NodeStatus {
  up: boolean;
  checking: boolean;
  lastChecked?: number;
}

interface DashboardState {
  environments: Environment[];
  nodes: NodeConfig[];
  connections: Connection[];
  nodeStatuses: Record<string, NodeStatus>;
  selectedEnvironmentId: string | null;
  agentToken: string;
  agentOnline: boolean;
  agentActions: AgentActionInfo[];

  loadConfig: () => Promise<void>;
  selectEnvironment: (id: string | null) => void;

  createEnvironment: (name: string) => Promise<void>;
  updateEnvironment: (id: string, name: string) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;

  createNode: (data: Omit<NodeConfig, 'id'>) => Promise<void>;
  updateNode: (
    id: string,
    data: Partial<Omit<NodeConfig, 'id' | 'environmentId'>>
  ) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;

  createConnection: (data: Omit<Connection, 'id'>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;

  checkNodeStatus: (nodeId: string) => Promise<void>;
  setAgentToken: (token: string) => void;
  setAgentOnline: (online: boolean) => void;
  refreshAgentActions: () => Promise<void>;
  runNode: (nodeId: string) => Promise<string>;
  stopNode: (nodeId: string) => Promise<string>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  environments: [],
  nodes: [],
  connections: [],
  nodeStatuses: {},
  selectedEnvironmentId: null,
  agentToken: '',
  agentOnline: false,
  agentActions: [],

  loadConfig: async () => {
    const config = await serverClient.getConfig();
    set({
      environments: config.environments,
      nodes: config.nodes,
      connections: config.connections,
    });
  },

  selectEnvironment: (id) => set({ selectedEnvironmentId: id }),

  createEnvironment: async (name) => {
    const env = await serverClient.createEnvironment(name);
    set((s) => ({ environments: [...s.environments, env] }));
  },

  updateEnvironment: async (id, name) => {
    const updated = await serverClient.updateEnvironment(id, name);
    set((s) => ({
      environments: s.environments.map((e) => (e.id === id ? updated : e)),
    }));
  },

  deleteEnvironment: async (id) => {
    await serverClient.deleteEnvironment(id);
    set((s) => ({
      environments: s.environments.filter((e) => e.id !== id),
      nodes: s.nodes.filter((n) => n.environmentId !== id),
      connections: s.connections.filter((c) => c.environmentId !== id),
      selectedEnvironmentId: s.selectedEnvironmentId === id ? null : s.selectedEnvironmentId,
    }));
  },

  createNode: async (data) => {
    const node = await serverClient.createNode(data);
    set((s) => ({ nodes: [...s.nodes, node] }));
  },

  updateNode: async (id, data) => {
    const updated = await serverClient.updateNode(id, data);
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? updated : n)),
    }));
  },

  deleteNode: async (id) => {
    await serverClient.deleteNode(id);
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      connections: s.connections.filter((c) => c.source !== id && c.target !== id),
    }));
  },

  createConnection: async (data) => {
    const conn = await serverClient.createConnection(data);
    set((s) => ({ connections: [...s.connections, conn] }));
  },

  deleteConnection: async (id) => {
    await serverClient.deleteConnection(id);
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
  },

  checkNodeStatus: async (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;

    set((s) => ({
      nodeStatuses: {
        ...s.nodeStatuses,
        [nodeId]: { up: s.nodeStatuses[nodeId]?.up ?? false, checking: true },
      },
    }));

    try {
      const result = await serverClient.checkHealth(node.healthUrl ?? node.url);
      set((s) => ({
        nodeStatuses: {
          ...s.nodeStatuses,
          [nodeId]: { up: result.up, checking: false, lastChecked: Date.now() },
        },
      }));
    } catch {
      set((s) => ({
        nodeStatuses: {
          ...s.nodeStatuses,
          [nodeId]: { up: false, checking: false, lastChecked: Date.now() },
        },
      }));
    }
  },

  setAgentToken: (token) => set({ agentToken: token }),
  setAgentOnline: (online) => set({ agentOnline: online }),

  refreshAgentActions: async () => {
    const { agentToken } = get();
    if (!agentToken) return;
    try {
      const actions = await agentClient.listActions(agentToken);
      set({ agentActions: actions });
    } catch {
      // agent offline or token invalid — leave previous state as-is
    }
  },

  runNode: async (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return 'Node not found';
    if (!node.runActionId) return 'No run action configured for this node';

    const healthUrl = node.healthUrl ?? node.url;
    const before = await serverClient.checkHealth(healthUrl);
    if (before.up) {
      await get().checkNodeStatus(nodeId);
      return 'Already running — open to see';
    }

    const result = await agentClient.runAction(node.runActionId, get().agentToken);
    if (!result.ok) {
      return result.stderr || 'Failed to start';
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await get().checkNodeStatus(nodeId);
    await get().refreshAgentActions();
    return 'Started — checking status';
  },

  stopNode: async (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return 'Node not found';
    if (!node.runActionId) return 'No run action configured for this node';

    const result = await agentClient.stopAction(node.runActionId, get().agentToken);
    await get().refreshAgentActions();
    await get().checkNodeStatus(nodeId);
    return result.ok ? 'Stopped' : result.message || 'Failed to stop';
  },
}));

if (typeof window !== 'undefined') {
  (window as unknown as { __store__?: typeof useDashboardStore }).__store__ = useDashboardStore;
}
