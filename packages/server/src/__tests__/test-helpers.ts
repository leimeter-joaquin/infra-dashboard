import { vi } from 'vitest';
import type { ConfigRepository } from '../repository/config-repository';
import type { Config } from '@infra-dashboard/shared';

export function makeMockRepo(initial: Partial<Config> = {}): ConfigRepository {
  let config: Config = {
    environments: initial.environments ?? [],
    nodes: initial.nodes ?? [],
    connections: initial.connections ?? [],
  };
  return {
    getConfig: vi.fn().mockImplementation(() => Promise.resolve(structuredClone(config))),
    saveConfig: vi.fn().mockImplementation((c: Config) => {
      config = structuredClone(c);
      return Promise.resolve();
    }),
  };
}
