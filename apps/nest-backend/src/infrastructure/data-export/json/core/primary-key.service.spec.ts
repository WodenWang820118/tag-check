import { describe, expect, it } from 'vitest';
import { PrimaryKeyService } from './primary-key.service';

describe('PrimaryKeyService', () => {
  const service = new PrimaryKeyService();

  it('returns single primary key info when meta has exactly one primary column', () => {
    const result = service.getPrimaryKeyInfo({
      primaryColumns: [{ propertyName: 'id' }]
    } as never);
    expect(result).toEqual({ primaryIsSingle: true, primaryKeyProp: 'id' });
  });

  it('returns composite info (no primaryKeyProp) when there are multiple primary columns', () => {
    const result = service.getPrimaryKeyInfo({
      primaryColumns: [{ propertyName: 'a' }, { propertyName: 'b' }]
    } as never);
    expect(result).toEqual({
      primaryIsSingle: false,
      primaryKeyProp: undefined
    });
  });

  it('treats missing primaryColumns as composite (no single key)', () => {
    const result = service.getPrimaryKeyInfo({} as never);
    expect(result.primaryIsSingle).toBe(false);
    expect(result.primaryKeyProp).toBeUndefined();
  });
});
