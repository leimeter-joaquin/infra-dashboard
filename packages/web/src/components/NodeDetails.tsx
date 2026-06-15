import { useState } from 'react';
import { useDashboardStore } from '../store/dashboard';
import type { NodeConfig } from '@infra-dashboard/shared';

interface Props {
  environmentId: string;
}

export function NodeDetails({ environmentId }: Props) {
  const { nodes, createNode, deleteNode } = useDashboardStore();
  const envNodes = nodes.filter((n) => n.environmentId === environmentId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [healthUrl, setHealthUrl] = useState('');
  const [runActionId, setRunActionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required');
      return;
    }
    setSaving(true);
    try {
      await createNode({
        environmentId,
        name: name.trim(),
        description: description.trim(),
        url: url.trim(),
        healthUrl: healthUrl.trim() || undefined,
        runActionId: runActionId.trim() || undefined,
        position: { x: Math.random() * 300, y: Math.random() * 200 },
      });
      setName('');
      setDescription('');
      setUrl('');
      setHealthUrl('');
      setRunActionId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create node');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Add node</div>
      <form
        onSubmit={handleCreate}
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name *"
          style={inputStyle}
          data-testid="node-name-input"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL * (https://...)"
          style={{ ...inputStyle, minWidth: 200 }}
          data-testid="node-url-input"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          style={inputStyle}
          data-testid="node-desc-input"
        />
        <input
          value={healthUrl}
          onChange={(e) => setHealthUrl(e.target.value)}
          placeholder="Health URL (optional)"
          style={{ ...inputStyle, minWidth: 180 }}
          data-testid="node-health-url-input"
        />
        <input
          value={runActionId}
          onChange={(e) => setRunActionId(e.target.value)}
          placeholder="Run action ID (optional)"
          style={inputStyle}
          data-testid="node-run-action-input"
        />
        <button
          type="submit"
          disabled={saving}
          style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}
        >
          {saving ? 'Adding...' : 'Add node'}
        </button>
      </form>
      {error && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{error}</div>}

      {envNodes.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {envNodes.map((n: NodeConfig) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                padding: '3px 0',
              }}
            >
              <span style={{ fontWeight: 500 }}>{n.name}</span>
              <span style={{ color: '#6b7280' }}>{n.url}</span>
              <button
                onClick={() => deleteNode(n.id)}
                style={{
                  fontSize: 11,
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label={`Delete node ${n.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '4px 6px',
  borderRadius: 4,
  border: '1px solid #d1d5db',
  minWidth: 120,
};
