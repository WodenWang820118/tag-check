import { describe, expect, it } from 'vitest';
import { RowMaterializerService } from './row-materializer.service';

describe('RowMaterializerService', () => {
  const service = new RowMaterializerService();

  const dateMeta = {
    columns: [
      { propertyName: 'createdAt', type: Date },
      { propertyName: 'updatedAt', type: 'datetime' },
      { propertyName: 'name', type: String }
    ]
  } as never;

  it('decodes serialized buffers ({ __type: "Buffer", data: <base64> }) to Buffer instances', () => {
    const base64 = Buffer.from('hello').toString('base64');
    const row = { blob: { __type: 'Buffer', data: base64 } };
    const out = service.materialize(row, dateMeta);
    expect(Buffer.isBuffer(out['blob'])).toBe(true);
    expect((out['blob'] as Buffer).toString()).toBe('hello');
  });

  it('converts ISO date strings to Date objects when the column metadata is a date type', () => {
    const iso = '2024-01-02T03:04:05.678Z';
    const row = { createdAt: iso, updatedAt: iso };
    const out = service.materialize(row, dateMeta);
    expect(out['createdAt']).toBeInstanceOf(Date);
    expect((out['createdAt'] as Date).toISOString()).toBe(iso);
    expect(out['updatedAt']).toBeInstanceOf(Date);
  });

  it('keeps ISO-looking strings as strings when the column is not a date type', () => {
    const row = { name: '2024-01-02T03:04:05.678Z' };
    const out = service.materialize(row, dateMeta);
    expect(out['name']).toBe('2024-01-02T03:04:05.678Z');
  });

  it('passes other values through untouched', () => {
    const row = { count: 5, ok: true, tag: 'plain' };
    const out = service.materialize(row, dateMeta);
    expect(out).toEqual(row);
  });
});
