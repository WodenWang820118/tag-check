import { Injectable } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';

/**
 * PrimaryKeyService
 *  - Isolates logic for determining primary key shape for an entity.
 */
@Injectable()
export class PrimaryKeyService {
  getPrimaryKeyInfo(meta: EntityMetadata): {
    primaryIsSingle: boolean;
    primaryKeyProp?: string;
  } {
    const primaryCols = Array.isArray(meta.primaryColumns)
      ? meta.primaryColumns
      : [];
    const primaryIsSingle = primaryCols.length === 1;
    const primaryKeyProp = primaryIsSingle
      ? primaryCols[0].propertyName
      : undefined;
    return { primaryIsSingle, primaryKeyProp };
  }
}
