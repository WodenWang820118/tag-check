import { Injectable, Logger } from '@nestjs/common';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';
import { ImportTransactionService } from '../core/import-transaction.service';
import { ImportStats } from '../../interfaces/import-types';

@Injectable()
export class ImportOrchestrator {
  private readonly logger = new Logger(ImportOrchestrator.name);
  constructor(private readonly tx: ImportTransactionService) {}

  async import(env: FixtureEnvelopeV1): Promise<void> {
    const { stats } = await this.tx.runWithinTransaction(env);
    this.logStats(stats);
  }

  private logStats(stats: Record<string, ImportStats>): void {
    for (const [entity, { inserted, skipped }] of Object.entries(stats)) {
      this.logger.log(
        `Imported ${entity}: inserted=${inserted} skipped=${skipped}`
      );
    }
  }
}
