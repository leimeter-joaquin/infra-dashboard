import { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  Handle,
  Position,
  type Connection as FlowConnection,
  type Node as FlowNode,
  type Edge as FlowEdge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { NodeConfig, Connection } from '@infra-dashboard/shared';
import type { NodeStatus } from '../store/dashboard';
import { StatusBadge } from './StatusBadge';

interface NodeData {
  label: string;
  url: string;
  description: string;
  status?: NodeStatus;
  onOpen: (url: string) => void;
  [key: string]: unknown;
}

function InfraNode({ data }: NodeProps) {
  const d = data as NodeData;
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
      <Handle type="target" position={Position.Left} />
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.label}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, wordBreak: 'break-all' }}>
        {d.url}
      </div>
      {d.description && (
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{d.description}</div>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <StatusBadge status={d.status} />
        <button
          style={{ fontSize: 11, cursor: 'pointer', marginLeft: 'auto' }}
          onClick={() => d.onOpen(d.url)}
        >
          Open
        </button>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { infraNode: InfraNode };

interface Props {
  nodes: NodeConfig[];
  connections: Connection[];
  statuses: Record<string, NodeStatus>;
  onConnectionCreate: (environmentId: string, source: string, target: string) => void;
  onConnectionDelete: (id: string) => void;
  onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
  environmentId: string;
}

function Flow({
  nodes,
  connections,
  statuses,
  onConnectionCreate,
  onConnectionDelete,
  onNodePositionChange,
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
          onOpen: openUrl,
        },
      })),
    [statuses, openUrl]
  );

  const toFlowEdges = (cs: Connection[]): FlowEdge[] =>
    cs.map((c) => ({ id: c.id, source: c.source, target: c.target }));

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(toFlowNodes(nodes));
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(toFlowEdges(connections));

  useEffect(() => { setRfNodes(toFlowNodes(nodes)); }, [nodes, statuses, setRfNodes, toFlowNodes]);
  useEffect(() => { setRfEdges(toFlowEdges(connections)); }, [connections, setRfEdges]);

  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (!params.source || !params.target) return;
      onConnectionCreate(environmentId, params.source, params.target);
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
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
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
