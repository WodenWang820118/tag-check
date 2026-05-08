import { describe, it, expect, vi } from 'vitest';
import { JsonProjectImportService } from './json-project-import.service';
import { ImportOrchestrator } from './import-orchestrator.service';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';

describe('JsonProjectImportService', () => {
  function build() {
    const orchestrator = {
      import: vi.fn().mockResolvedValue(undefined)
    } as unknown as ImportOrchestrator;
    return { svc: new JsonProjectImportService(orchestrator), orchestrator };
  }

  describe('validate', () => {
    it('throws when payload is not an object', () => {
      const { svc } = build();
      expect(() => svc.validate(null)).toThrow('Invalid payload');
      expect(() => svc.validate('foo')).toThrow('Invalid payload');
    });

    it('throws when version is not 1', () => {
      const { svc } = build();
      expect(() => svc.validate({ version: 2, entities: {} })).toThrow(
        'Unsupported fixture version'
      );
    });

    it('throws when entities are missing', () => {
      const { svc } = build();
      expect(() => svc.validate({ version: 1 })).toThrow('Missing entities');
    });

    it('returns the typed envelope when valid', () => {
      const { svc } = build();
      const env = { version: 1, entities: {}, projectSlug: 'p' };
      expect(svc.validate(env)).toBe(env);
    });
  });

  describe('importProject', () => {
    it('validates and forwards to orchestrator.import', async () => {
      const { svc, orchestrator } = build();
      const env = {
        version: 1,
        entities: {},
        projectSlug: 'demo'
      } as unknown as FixtureEnvelopeV1;
      await svc.importProject(env);
      expect(orchestrator.import).toHaveBeenCalledWith(env);
    });
  });
});
