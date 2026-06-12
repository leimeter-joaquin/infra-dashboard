import type { NodeStatus } from '../store/dashboard';

interface Props {
  status?: NodeStatus;
}

export function StatusBadge({ status }: Props) {
  if (!status) {
    return <span style={{ fontSize: 11, color: '#999' }}>pending</span>;
  }
  if (status.checking) {
    return <span style={{ fontSize: 11, color: '#aaa' }}>checking...</span>;
  }
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: status.up ? '#16a34a' : '#dc2626',
      }}
    >
      {status.up ? 'UP' : 'DOWN'}
    </span>
  );
}
