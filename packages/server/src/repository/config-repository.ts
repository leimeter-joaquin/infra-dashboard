import type { Config } from '@infra-dashboard/shared';

export interface ConfigRepository {
  getConfig(): Promise<Config>;
  saveConfig(config: Config): Promise<void>;
}
