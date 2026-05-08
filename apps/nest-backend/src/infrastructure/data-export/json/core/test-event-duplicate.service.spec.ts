import { describe, it, expect, vi } from 'vitest';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { IdMapRegistryService } from './id-map-registry.service';

describe('TestEventDuplicateService', () => {
  function build() {
    const map = new Map<unknown, unknown>();
    const idMapRegistry = {
      ensure: vi.fn(() => map)
    } as unknown as IdMapRegistryService;
    return {
      svc: new TestEventDuplicateService(idMapRegistry),
      map,
      idMapRegistry
    };
  }

  describe('handleDuplicate', () => {
    it('returns false when the entity is not TestEventEntity', () => {
      const { svc } = build();
      const result = svc.handleDuplicate(
        { name: 'Other' } as never,
        {},
        {},
        new Map(),
        { primaryIsSingle: true, primaryKeyProp: 'id' }
      );
      expect(result).toBe(false);
    });

    it('returns false when there is no composite map', () => {
      const { svc } = build();
      const result = svc.handleDuplicate(
        { name: 'TestEventEntity' } as never,
        {},
        { eventId: 'e', projectId: 1 },
        null,
        { primaryIsSingle: true, primaryKeyProp: 'id' }
      );
      expect(result).toBe(false);
    });

    it('wires the id map and proceeds (returns false) for an existing duplicate', () => {
      const { svc, map } = build();
      const composite = new Map<string, unknown>([['1::evt', 99]]);
      const result = svc.handleDuplicate(
        { name: 'TestEventEntity' } as never,
        { id: 7 },
        { eventId: 'evt', projectId: 1 },
        composite,
        { primaryIsSingle: true, primaryKeyProp: 'id' }
      );
      expect(result).toBe(false);
      expect(map.get(7)).toBe(99);
    });

    it('returns true when raw.skipIfDuplicate is set', () => {
      const { svc } = build();
      const composite = new Map<string, unknown>([['1::evt', 99]]);
      const result = svc.handleDuplicate(
        { name: 'TestEventEntity' } as never,
        { id: 7, skipIfDuplicate: true },
        { eventId: 'evt', projectId: 1 },
        composite,
        { primaryIsSingle: true, primaryKeyProp: 'id' }
      );
      expect(result).toBe(true);
    });

    it('returns false when the composite key does not match', () => {
      const { svc } = build();
      const composite = new Map<string, unknown>([['2::other', 99]]);
      const result = svc.handleDuplicate(
        { name: 'TestEventEntity' } as never,
        { id: 7 },
        { eventId: 'evt', projectId: 1 },
        composite,
        { primaryIsSingle: true, primaryKeyProp: 'id' }
      );
      expect(result).toBe(false);
    });
  });
});
