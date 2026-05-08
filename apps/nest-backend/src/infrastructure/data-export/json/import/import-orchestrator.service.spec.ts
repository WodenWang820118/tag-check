import { describe, it, expect, vi } from 'vitest';
import { ImportOrchestrator } from './import-orchestrator.service';
import { ImportTransactionService } from '../core/import-transaction.service';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';

describe('ImportOrchestrator', () => {
  it('runs the transaction and logs returned stats per entity', async () => {
    const stats = {
      project: { inserted: 2, skipped: 1 },
      tag: { inserted: 5, skipped: 0 }
    };
    const tx = {
      runWithinTransaction: vi.fn().mockResolvedValue({ stats })
    } as unknown as ImportTransactionService;

    const svc = new ImportOrchestrator(tx);
    const env = {
      version: 1,
      projectSlug: 'p'
    } as unknown as FixtureEnvelopeV1;

    const logSpy = vi
      .spyOn(
        (svc as unknown as { logger: { log: (m: string) => void } }).logger,
        'log'
      )
      .mockImplementation(() => undefined);

    await svc.import(env);

    expect(tx.runWithinTransaction).toHaveBeenCalledWith(env);
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy.mock.calls[0][0]).toContain('project');
    expect(logSpy.mock.calls[1][0]).toContain('tag');
  });
});
