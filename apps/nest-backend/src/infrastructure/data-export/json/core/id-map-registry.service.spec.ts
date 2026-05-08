import { beforeEach, describe, expect, it } from 'vitest';
import { IdMapRegistryService } from './id-map-registry.service';

describe('IdMapRegistryService', () => {
  let service: IdMapRegistryService;

  beforeEach(() => {
    service = new IdMapRegistryService();
  });

  it('ensure() lazily creates and reuses the per-entity Map', () => {
    const a = service.ensure('TagEntity');
    const b = service.ensure('TagEntity');
    expect(a).toBeInstanceOf(Map);
    expect(a).toBe(b);
  });

  it('set/get/has roundtrip records the old->new id mapping', () => {
    service.set('TagEntity', 1, 'new-1');
    expect(service.get('TagEntity', 1)).toBe('new-1');
    expect(service.has('TagEntity', 1)).toBe(true);
  });

  it('set ignores entries when oldId or newId is null/undefined', () => {
    service.set('TagEntity', null, 'new-1');
    service.set('TagEntity', 1, undefined);
    expect(service.has('TagEntity', null)).toBe(false);
    expect(service.has('TagEntity', 1)).toBe(false);
  });

  it('get returns undefined when no map exists for the entity', () => {
    expect(service.get('Missing', 1)).toBeUndefined();
    expect(service.has('Missing', 1)).toBe(false);
  });

  it('getAll exposes the internal map registry by entity name', () => {
    service.set('TagEntity', 1, 'a');
    service.set('VarEntity', 2, 'b');
    const all = service.getAll();
    expect(Object.keys(all).sort()).toEqual(['TagEntity', 'VarEntity']);
    expect(all['TagEntity'].get(1)).toBe('a');
  });

  it('clear removes every registered entity map', () => {
    service.set('TagEntity', 1, 'a');
    service.clear();
    expect(service.has('TagEntity', 1)).toBe(false);
    expect(Object.keys(service.getAll())).toHaveLength(0);
  });
});
