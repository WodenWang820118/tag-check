import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseConfigService } from './database.service';

describe('DatabaseConfigService', () => {
  const original = process.env.DB_LOGGING;

  beforeEach(() => {
    delete process.env.DB_LOGGING;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.DB_LOGGING;
    else process.env.DB_LOGGING = original;
  });

  function build() {
    const configsService = {
      getDatabasePath: vi.fn().mockReturnValue('/db.sqlite')
    };
    return new DatabaseConfigService(configsService as never);
  }

  it('returns sqlite TypeORM options with logging disabled by default', () => {
    const cfg = build().getTypeOrmConfig();
    expect(cfg).toMatchObject({
      type: 'sqlite',
      database: '/db.sqlite',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
      retryAttempts: 10,
      retryDelay: 3000
    });
  });

  it('enables logging when DB_LOGGING=true', () => {
    process.env.DB_LOGGING = 'true';
    expect(build().getTypeOrmConfig().logging).toBe(true);
  });
});
