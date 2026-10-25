import { Injectable } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';
import { FixtureRow } from '../../interfaces/fixture-types';

/**
 * Turns an exported row back into values TypeORM can save: base64 buffers
 * into Buffers and ISO strings of date columns into Dates.
 *
 * It also drops the inverse side of every relation (such as a project's
 * `testEvents` or a test's `testEventDetails`), which the export writes as
 * lists of exported IDs. The owning side carries the foreign key, and saving
 * a list TypeORM cannot match to the current children makes it detach them:
 * re-importing a project set its existing tests' project to NULL.
 */
@Injectable()
export class RowMaterializerService {
  materialize(raw: FixtureRow, meta: EntityMetadata): FixtureRow {
    const inverseProps = new Set(
      (meta.relations ?? [])
        .filter(
          (relation) => !(relation.isManyToOne || relation.isOneToOneOwner)
        )
        .map((relation) => relation.propertyName)
    );
    const out: FixtureRow = {};
    for (const [k, v] of Object.entries(raw)) {
      if (inverseProps.has(k)) continue;
      if (this.isSerializedBuffer(v)) {
        out[k] = Buffer.from(v.data, 'base64');
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
