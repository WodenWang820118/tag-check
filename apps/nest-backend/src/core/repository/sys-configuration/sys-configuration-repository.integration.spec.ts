import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from '../../database/database-entities';
import { DATABASE_MIGRATIONS } from '../../database/database-migrations';
import { SysConfigurationEntity } from '../../../shared';
import { SysConfigurationRepositoryService } from './sys-configuration-repository.service';

describe('SysConfigurationRepositoryService on SQLite', () => {
  let folder: string;

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'sys-configuration-'));
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  async function open(): Promise<{
    database: DataSource;
    service: SysConfigurationRepositoryService;
  }> {
    const database = await new DataSource({
      type: 'sqlite',
      database: join(folder, 'db.sqlite'),
      entities: DATABASE_ENTITIES,
      migrations: DATABASE_MIGRATIONS
    }).initialize();
    await database.runMigrations();
    const service = new SysConfigurationRepositoryService(
      database.getRepository(SysConfigurationEntity),
      {} as never
    );
    return { database, service };
  }

  it('replaces a saved value as the first write of a new connection', async () => {
    const first = await open();
    await first.service.setValue('aiAssist.enabled', 'false', 'AI assist');
    await first.database.destroy();

    // A restarted backend: nothing inserted on this connection yet.
    const second = await open();
    await second.service.setValue('aiAssist.enabled', 'true', 'AI assist');

    await expect(second.service.getValue('aiAssist.enabled')).resolves.toBe(
      'true'
    );
    await second.database.destroy();
  });
});
