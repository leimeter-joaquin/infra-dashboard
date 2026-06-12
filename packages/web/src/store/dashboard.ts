import { create } from 'zustand';
import type { Environment, NodeConfig, Connection } from '@infra-dashboard/shared';
import { serverClient } from '../api/server-client';

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

  loadConfig: () => Promise<void>;
  selectEnvironment: (id: string | null) => void;

  createEnvironment: (name: string) => Promise<void>;
  updateEnvironment: (id: string, name: string) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;

  createNode: (data: Omit<NodeConfig, 'id'>) => Promise<void>;
  updateNode: (id: string, data: Partial<Omit<NodeConfig, 'id' | 'environmentId'>>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;

  createConnection: (data: Omit<Connection, 'id'>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;

  checkNodeStatus: (nodeId: string) => Promise<void>;
  setAgentToken: (token: string) => void;
  setAgentOnline: (online: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  environments: [],
  nodes: [],
  connections: [],
  nodeStatuses: {},
  selectedEnvironmentId: null,
  agentToken: '',
  agentOnline: false,

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
      const result = await serverClient.checkHealth(node.url);
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
}));
