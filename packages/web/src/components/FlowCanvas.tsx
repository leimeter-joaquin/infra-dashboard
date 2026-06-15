import { useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  ConnectionMode,
  Handle,
  Position,
  type Connection as FlowConnection,
  type Node as FlowNode,
  type Edge as FlowEdge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeConfig, Connection, AgentActionInfo } from '@infra-dashboard/shared';
import type { NodeStatus } from '../store/dashboard';
import { StatusBadge } from './StatusBadge';

interface NodeData {
  label: string;
  url: string;
  description: string;
  status?: NodeStatus;
  runActionId?: string;
  isRunning: boolean;
  onOpen: (url: string) => void;
  onRun: (nodeId: string) => Promise<string>;
  onStop: (nodeId: string) => Promise<string>;
  [key: string]: unknown;
}

function InfraNode({ id, data }: NodeProps) {
  const d = data as NodeData;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRun = async () => {
    setBusy(true);
    setMessage('');
    try {
      setMessage(await d.onRun(id));
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    setBusy(true);
    setMessage('');
    try {
      setMessage(await d.onStop(id));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: 6,
        background: '#fff',
        minWidth: 160,
        fontSize: 13,
      }}
    >
      <Handle type="source" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" style={handleStyle} />
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.label}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, wordBreak: 'break-all' }}>
        {d.url}
      </div>
      {d.description && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{d.description}</div>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <StatusBadge status={d.status} />
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {d.runActionId &&
            (d.isRunning ? (
              <button
                style={{ fontSize: 11, cursor: 'pointer' }}
                onClick={handleStop}
                disabled={busy}
              >
                {busy ? '...' : 'Stop'}
              </button>
            ) : (
              <button
                style={{ fontSize: 11, cursor: 'pointer' }}
                onClick={handleRun}
                disabled={busy}
              >
                {busy ? '...' : 'Run'}
              </button>
            ))}
          <button style={{ fontSize: 11, cursor: 'pointer' }} onClick={() => d.onOpen(d.url)}>
            Open
          </button>
        </div>
      </div>
      {message && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{message}</div>}
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
    </div>
  );
}

const handleStyle = { background: '#9ca3af', border: '1px solid #6b7280' };

const nodeTypes = { infraNode: InfraNode };

interface Props {
  nodes: NodeConfig[];
  connections: Connection[];
  statuses: Record<string, NodeStatus>;
  agentActions: AgentActionInfo[];
  onConnectionCreate: (
    environmentId: string,
    source: string,
    target: string,
    sourceHandle?: string | null,
    targetHandle?: string | null
  ) => void;
  onConnectionDelete: (id: string) => void;
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
  onRun: (nodeId: string) => Promise<string>;
  onStop: (nodeId: string) => Promise<string>;
  environmentId: string;
}

function Flow({
  nodes,
  connections,
  statuses,
  agentActions,
  onConnectionCreate,
  onConnectionDelete,
  onNodePositionChange,
  onRun,
  onStop,
  environmentId,
}: Props) {
  const openUrl = useCallback((url: string) => window.open(url, '_blank', 'noopener'), []);

  const toFlowNodes = useCallback(
    (ns: NodeConfig[]): FlowNode[] =>
      ns.map((n) => ({
        id: n.id,
        type: 'infraNode',
        position: n.position,
        data: {
          label: n.name,
          url: n.url,
          description: n.description,
          status: statuses[n.id],
          runActionId: n.runActionId,
          isRunning: agentActions.find((a) => a.id === n.runActionId)?.running ?? false,
          onOpen: openUrl,
          onRun,
          onStop,
        },
      })),
    [statuses, agentActions, openUrl, onRun, onStop]
  );

  const toFlowEdges = (cs: Connection[]): FlowEdge[] =>
    cs.map((c) => ({
      id: c.id,
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle,
      targetHandle: c.targetHandle,
    }));

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(toFlowNodes(nodes));
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(toFlowEdges(connections));

  useEffect(() => {
    setRfNodes(toFlowNodes(nodes));
  }, [nodes, statuses, setRfNodes, toFlowNodes]);
  useEffect(() => {
    setRfEdges(toFlowEdges(connections));
  }, [connections, setRfEdges]);

  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (!params.source || !params.target) return;
      onConnectionCreate(
        environmentId,
        params.source,
        params.target,
        params.sourceHandle,
        params.targetHandle
      );
      setRfEdges((eds) => addEdge(params, eds));
    },
    [environmentId, onConnectionCreate, setRfEdges]
  );

  const onEdgesDelete = useCallback(
    (edges: FlowEdge[]) => {
      edges.forEach((e) => onConnectionDelete(e.id));
    },
    [onConnectionDelete]
  );

  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: FlowNode) => {
      onNodePositionChange(node.id, node.position);
    },
    [onNodePositionChange]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <style>{`
        .react-flow__handle {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .react-flow__node:hover .react-flow__handle {
          opacity: 1;
        }
      `}</style>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function FlowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
