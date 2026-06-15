import { z } from 'zod';

export const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.string(),
});

export const NodeConfigSchema = z.object({
  id: z.string(),
  environmentId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  url: z.string().url(),
  healthUrl: z.string().url().optional(),
  runActionId: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
});

export const ConnectionSchema = z.object({
  id: z.string(),
  environmentId: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const ConfigSchema = z.object({
  environments: z.array(EnvironmentSchema),
  nodes: z.array(NodeConfigSchema),
  connections: z.array(ConnectionSchema),
});

export const CreateEnvironmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const UpdateEnvironmentSchema = z.object({
  name: z.string().min(1).optional(),
});

export const CreateNodeSchema = z.object({
  environmentId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  url: z.string().url('Must be a valid URL'),
  healthUrl: z.string().url('Must be a valid URL').optional(),
  runActionId: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }),
});

export const UpdateNodeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  healthUrl: z.string().url().optional(),
  runActionId: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const CreateConnectionSchema = z.object({
  environmentId: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const HealthCheckRequestSchema = z.object({
  url: z.string().url('Must be a valid URL'),
});
