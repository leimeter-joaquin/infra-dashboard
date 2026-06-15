import { useState } from 'react';
import { useDashboardStore } from '../store/dashboard';

export function EnvironmentSidebar() {
  const {
    environments,
    selectedEnvironmentId,
    selectEnvironment,
    createEnvironment,
    deleteEnvironment,
  } = useDashboardStore();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await createEnvironment(trimmed);
      setNewName('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside
      style={{
        width: 220,
        borderRight: '1px solid #e5e7eb',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: '#f9fafb',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 4 }}>
        Environments
      </div>

      {environments.map((env) => (
        <div
          key={env.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderRadius: 4,
            cursor: 'pointer',
            background: selectedEnvironmentId === env.id ? '#e0e7ff' : 'transparent',
            fontWeight: selectedEnvironmentId === env.id ? 600 : 400,
            fontSize: 13,
          }}
          onClick={() => selectEnvironment(env.id)}
          data-testid={`env-item-${env.id}`}
        >
          <span style={{ flex: 1 }}>{env.name}</span>
          <button
            style={{
              fontSize: 11,
              color: '#ef4444',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              deleteEnvironment(env.id);
            }}
            aria-label={`Delete ${env.name}`}
          >
            x
          </button>
        </div>
      ))}

      <form
        onSubmit={handleCreate}
        style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New environment..."
          style={{ fontSize: 12, padding: '4px 6px', borderRadius: 4, border: '1px solid #d1d5db' }}
          data-testid="new-env-input"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          style={{ fontSize: 12, padding: '4px', borderRadius: 4, cursor: 'pointer' }}
          data-testid="create-env-btn"
        >
          {creating ? 'Creating...' : 'Add'}
        </button>
      </form>
    </aside>
  );
}
