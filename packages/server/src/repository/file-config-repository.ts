import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Config } from '@infra-dashboard/shared';
import type { ConfigRepository } from './config-repository';

const DEFAULT_CONFIG: Config = {
  environments: [],
  nodes: [],
  connections: [],
};

export class FileConfigRepository implements ConfigRepository {
  constructor(private readonly filePath: string) {}

  async getConfig(): Promise<Config> {
    try {
      const content = await readFile(this.filePath, 'utf-8');
      return JSON.parse(content) as Config;
    } catch {
      return structuredClone(DEFAULT_CONFIG);
    }
  }

  async saveConfig(config: Config): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
  }
}
