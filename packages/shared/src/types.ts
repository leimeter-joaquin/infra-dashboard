export interface Environment {
  id: string;
  name: string;
  createdAt: string;
}

export interface NodeConfig {
  id: string;
  environmentId: string;
  name: string;
  description: string;
  url: string;
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  environmentId: string;
  source: string;
  target: string;
}

export interface Config {
  environments: Environment[];
  nodes: NodeConfig[];
  connections: Connection[];
}

export interface HealthCheckResult {
  up: boolean;
  status: number | null;
  ms: number;
}

export interface AgentActionResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface AgentActionInfo {
  id: string;
  description: string;
}
