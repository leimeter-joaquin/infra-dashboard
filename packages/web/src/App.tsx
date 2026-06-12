import { useEffect } from 'react';
import { useDashboardStore } from './store/dashboard';
import { EnvironmentSidebar } from './components/EnvironmentSidebar';
import { FlowCanvas } from './components/FlowCanvas';
import { NodeDetails } from './components/NodeDetails';
import { agentClient } from './api/agent-client';

const HEALTH_POLL_INTERVAL_MS = 10_000;

export function App() {
  const {
    selectedEnvironmentId,
    nodes,
    connections,
    nodeStatuses,
    loadConfig,
    createConnection,
    deleteConnection,
    updateNode,
    setAgentOnline,
    agentOnline,
    agentToken,
    setAgentToken,
  } = useDashboardStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Health check polling — server-side fetch, no CORS issues.
  useEffect(() => {
    const { checkNodeStatus, nodes: currentNodes, selectedEnvironmentId: envId } =
      useDashboardStore.getState();
    const poll = () => {
      const { nodes: ns, selectedEnvironmentId: eid } = useDashboardStore.getState();
      const targets = eid ? ns.filter((n) => n.environmentId === eid) : ns;
      targets.forEach((n) => checkNodeStatus(n.id));
    };
    poll();
    void currentNodes;
    void envId;
    const interval = setInterval(poll, HEALTH_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedEnvironmentId]);

  // Check if agent is running.
  useEffect(() => {
    const checkAgent = async () => {
      const online = await agentClient.ping();
      setAgentOnline(online);
    };
    checkAgent();
    const interval = setInterval(checkAgent, 15_000);
    return () => clearInterval(interval);
  }, [setAgentOnline]);

  const visibleNodes = selectedEnvironmentId
    ? nodes.filter((n) => n.environmentId === selectedEnvironmentId)
    : [];
  const visibleConnections = selectedEnvironmentId
    ? connections.filter((c) => c.environmentId === selectedEnvironmentId)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      <header
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#fff',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16 }}>Infra Dashboard</span>
        <span style={{ fontSize: 12, color: agentOnline ? '#16a34a' : '#9ca3af' }}>
          Agent: {agentOnline ? 'online' : 'offline'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12 }}>Agent token:</label>
          <input
            type="password"
            value={agentToken}
            onChange={(e) => setAgentToken(e.target.value)}
            placeholder="paste token..."
            style={{ fontSize: 12, padding: '3px 6px', borderRadius: 4, border: '1px solid #d1d5db', width: 160 }}
          />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <EnvironmentSidebar />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedEnvironmentId ? (
            <>
              <NodeDetails environmentId={selectedEnvironmentId} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <FlowCanvas
                  nodes={visibleNodes}
                  connections={visibleConnections}
                  statuses={nodeStatuses}
                  environmentId={selectedEnvironmentId}
                  onConnectionCreate={(environmentId, source, target) =>
                    createConnection({ environmentId, source, target })
                  }
                  onConnectionDelete={deleteConnection}
                  onNodePositionChange={(id, position) => updateNode(id, { position })}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: 14,
              }}
            >
              Select or create an environment to get started.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
