import { describe, it, expect, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { FileConfigRepository } from '../repository/file-config-repository';

const tmpFile = join(tmpdir(), `infra-dashboard-test-${process.pid}.json`);

describe('FileConfigRepository', () => {
  afterEach(async () => {
    await rm(tmpFile, { force: true });
  });

  it('returns empty config when file does not exist', async () => {
    const repo = new FileConfigRepository(tmpFile);
    const config = await repo.getConfig();
    expect(config).toEqual({ environments: [], nodes: [], connections: [] });
  });

  it('saves and retrieves config', async () => {
    const repo = new FileConfigRepository(tmpFile);
    const config = {
      environments: [{ id: '1', name: 'local', createdAt: '2024-01-01T00:00:00.000Z' }],
      nodes: [],
      connections: [],
    };
    await repo.saveConfig(config);
    const retrieved = await repo.getConfig();
    expect(retrieved).toEqual(config);
  });

  it('overwrites existing config on save', async () => {
    const repo = new FileConfigRepository(tmpFile);
    await repo.saveConfig({ environments: [{ id: '1', name: 'a', createdAt: '' }], nodes: [], connections: [] });
    await repo.saveConfig({ environments: [], nodes: [], connections: [] });
    const config = await repo.getConfig();
    expect(config.environments).toHaveLength(0);
  });
});
