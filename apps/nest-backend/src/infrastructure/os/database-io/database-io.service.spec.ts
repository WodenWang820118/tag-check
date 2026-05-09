import { describe, expect, it } from 'vitest';
import { DatabaseIoService } from './database-io.service';

describe('DatabaseIoService (stub)', () => {
  const svc = new DatabaseIoService();

  it('dumpProjectDatabase() rejects with the not-implemented error', async () => {
    await expect(svc.dumpProjectDatabase('demo')).rejects.toThrow(
      'dumpProjectDatabase not implemented'
    );
  });

  it('importProjectDatabase() rejects with the not-implemented error', async () => {
    await expect(svc.importProjectDatabase('/tmp/x.sql')).rejects.toThrow(
      'importProjectDatabase not implemented'
    );
  });
});
