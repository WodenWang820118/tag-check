import { Injectable } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';
import { FixtureRow } from '../../interfaces/fixture-types';

@Injectable()
export class RowMaterializerService {
  materialize(raw: FixtureRow, meta: EntityMetadata): FixtureRow {
    const out: FixtureRow = {};
    for (const [k, v] of Object.entries(raw)) {
      if (this.isSerializedBuffer(v)) {
        const data = v.data;
        out[k] = Buffer.from(data, 'base64');
      } else if (
        typeof v === 'string' &&
        this.looksIsoDate(v) &&
        this.columnIsDate(meta, k)
      ) {
        out[k] = new Date(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  private isSerializedBuffer(
    v: unknown
  ): v is { __type: 'Buffer'; data: string } {
    return !!(
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      (v as Record<string, unknown>)['__type'] === 'Buffer' &&
      typeof (v as Record<string, unknown>)['data'] === 'string'
    );
  }

  private looksIsoDate(v: string): boolean {
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(v);
  }

  private columnIsDate(meta: EntityMetadata, prop: string): boolean {
    return meta.columns.some(
      (c) =>
        c.propertyName === prop &&
        (c.type === Date || c.type === 'datetime' || c.type === 'timestamp')
    );
  }
}
