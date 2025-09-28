import { Injectable, Logger } from '@nestjs/common';
import { ProjectImportProvider } from '../../interfaces/project-import-provider.interface';
import { ImportOrchestrator } from './import-orchestrator.service';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';

@Injectable()
export class JsonProjectImportService implements ProjectImportProvider {
  private readonly logger = new Logger(JsonProjectImportService.name);
  constructor(private readonly orchestrator: ImportOrchestrator) {}

  async importProject(payload: unknown): Promise<void> {
    const env: FixtureEnvelopeV1 = this.validate(payload);
    this.logger.log(`Importing project (JSON) slug=${env.projectSlug}`);
    await this.orchestrator.import(env);
  }

  validate(payload: unknown): FixtureEnvelopeV1 {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload');
    }
    const env = payload as FixtureEnvelopeV1;
    if (env.version !== 1) throw new Error('Unsupported fixture version');
    if (!env.entities) throw new Error('Missing entities');
    return env;
  }
}
