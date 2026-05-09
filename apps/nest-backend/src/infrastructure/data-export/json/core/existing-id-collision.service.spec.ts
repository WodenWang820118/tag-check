import { describe, expect, it, vi } from 'vitest';
import { ExistingIdCollisionService } from './existing-id-collision.service';

describe('ExistingIdCollisionService', () => {
  const service = new ExistingIdCollisionService();

  it('returns false (do not skip) when pkVal is null', () => {
    expect(
      service.handleCollision({
        metaName: 'TagEntity',
        pkVal: null,
        rawPkVal: 'old',
        idMap: vi.fn()
      })
    ).toBe(false);
  });

  it('records id-map, increments stat, and returns true (skip) for non-upsert-eligible entities', () => {
    const idMap = vi.fn();
    const incrementSkipStat = vi.fn();
    const result = service.handleCollision({
      metaName: 'TagEntity',
      pkVal: 5,
      rawPkVal: 'old',
      idMap,
      incrementSkipStat
    });
    expect(result).toBe(true);
    expect(idMap).toHaveBeenCalledWith('old', 5);
    expect(incrementSkipStat).toHaveBeenCalledOnce();
  });

  it('returns false for upsert-eligible entity types so the caller can perform an upsert', () => {
    const idMap = vi.fn();
    const incrementSkipStat = vi.fn();
    const result = service.handleCollision({
      metaName: 'SpecEntity',
      pkVal: 5,
      rawPkVal: 'old',
      idMap,
      incrementSkipStat
    });
    expect(result).toBe(false);
    expect(idMap).not.toHaveBeenCalled();
    expect(incrementSkipStat).not.toHaveBeenCalled();
  });

  it('does not invoke idMap when rawPkVal is null', () => {
    const idMap = vi.fn();
    service.handleCollision({
      metaName: 'TagEntity',
      pkVal: 5,
      rawPkVal: null,
      idMap
    });
    expect(idMap).not.toHaveBeenCalled();
  });
});
