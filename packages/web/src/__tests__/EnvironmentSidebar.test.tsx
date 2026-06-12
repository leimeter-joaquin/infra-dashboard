import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnvironmentSidebar } from '../components/EnvironmentSidebar';
import { useDashboardStore } from '../store/dashboard';

vi.mock('../api/server-client', () => ({
  serverClient: {
    createEnvironment: vi.fn().mockImplementation((name: string) =>
      Promise.resolve({ id: 'env-created', name, createdAt: new Date().toISOString() })
    ),
    deleteEnvironment: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

function setup(environments = [{ id: 'env-1', name: 'local', createdAt: '' }]) {
  useDashboardStore.setState({
    environments,
    nodes: [],
    connections: [],
    nodeStatuses: {},
    selectedEnvironmentId: null,
    agentToken: '',
    agentOnline: false,
  });
}

describe('EnvironmentSidebar', () => {
  it('renders environment names', () => {
    setup();
    render(<EnvironmentSidebar />);
    expect(screen.getByText('local')).toBeDefined();
  });

  it('renders all environments', () => {
    setup([
      { id: 'e1', name: 'local', createdAt: '' },
      { id: 'e2', name: 'preview', createdAt: '' },
    ]);
    render(<EnvironmentSidebar />);
    expect(screen.getByText('local')).toBeDefined();
    expect(screen.getByText('preview')).toBeDefined();
  });

  it('shows empty input initially', () => {
    setup();
    render(<EnvironmentSidebar />);
    const input = screen.getByTestId('new-env-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('creates environment on form submit', async () => {
    setup([]);
    render(<EnvironmentSidebar />);

    const input = screen.getByTestId('new-env-input');
    fireEvent.change(input, { target: { value: 'production' } });
    fireEvent.click(screen.getByTestId('create-env-btn'));

    await waitFor(() => {
      expect(useDashboardStore.getState().environments).toHaveLength(1);
    });
    expect(useDashboardStore.getState().environments[0].name).toBe('production');
  });
});
