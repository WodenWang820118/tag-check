import { Injectable } from '@nestjs/common';
import { EntityMetadata, QueryRunner } from 'typeorm';
import {
  DeferredPointer,
  ImportRuntimeContext
} from '../../interfaces/import-types';
import { IdMapRegistryService } from './id-map-registry.service';

type RelationMetadata = EntityMetadata['relations'][number];

/**
 * Sets the pointers an import could not set when it inserted a row, because
 * they target rows of an entity imported later. A test points at its latest
 * result and screenshot, which are imported after the test: their exported
 * IDs mean nothing in this database, and inserting them would fail on the
 * foreign key or point at another project's rows.
 */
@Injectable()
export class PointerRepairService {
  constructor(private readonly idMapRegistry: IdMapRegistryService) {}

  /**
   * Removes from a row about to be inserted its pointers to entities in
   * `ctx.pendingEntities`, and records them in `ctx.deferredPointers`. Does
   * nothing when the context does not track pending entities.
   *
   * @param materialized - The row to insert; its pointer properties are deleted.
   * @param raw - The exported row, which keeps the exported IDs.
   * @param primaryKeyProp - The entity's single primary key property.
   */
  deferForwardPointers(
    materialized: Record<string, unknown>,
    raw: Record<string, unknown>,
    meta: EntityMetadata,
    ctx: Pick<ImportRuntimeContext, 'pendingEntities' | 'deferredPointers'>,
    primaryKeyProp: string | undefined
  ): void {
    const { pendingEntities, deferredPointers } = ctx;
    if (!pendingEntities || !deferredPointers || !primaryKeyProp) return;
    for (const relation of meta.relations) {
      if (!(relation.isManyToOne || relation.isOneToOneOwner)) continue;
      const targetEntityName = relation.inverseEntityMetadata?.name;
      if (!targetEntityName || !pendingEntities.has(targetEntityName)) continue;

      const props = [
        relation.propertyName,
        ...this.columnPropsOf(meta, relation)
      ];
      const exportedTargetId = props
        .map((prop) => this.idOf(raw[prop]))
        .find((id) => id != null);
      for (const prop of props) delete materialized[prop];
      if (exportedTargetId == null) continue;
      deferredPointers.push({
        entityName: meta.name,
        exportedRowId: raw[primaryKeyProp],
        relationProp: relation.propertyName,
        targetEntityName,
        exportedTargetId
      });
    }
  }

  /**
   * Sets each deferred pointer whose row and target were both imported. A
   * pointer of a row the import merged into an existing one is left alone,
   * so an import never repoints rows that were already there.
   */
  async repairPointers(
    queryRunner: QueryRunner,
    deferredPointers: readonly DeferredPointer[]
  ): Promise<void> {
    for (const pointer of deferredPointers) {
      const rowId = this.idMapRegistry.get(
        pointer.entityName,
        pointer.exportedRowId
      );
      const targetId = this.idMapRegistry.get(
        pointer.targetEntityName,
        pointer.exportedTargetId
      );
      if (rowId == null || targetId == null) continue;
      if (!this.idMapRegistry.wasCreated(pointer.entityName, rowId)) continue;
      // Sequential on purpose: the updates share the import's query runner
      // and transaction, which run one statement at a time.
      await queryRunner.manager
        .getRepository(pointer.entityName)
        .update(rowId, { [pointer.relationProp]: { id: targetId } });
    }
  }

  /**
   * Properties other than the relation that map to its join column, such as
   * `latestTestEventDetailId` next to `latestTestEventDetail`.
   */
  private columnPropsOf(
    meta: EntityMetadata,
    relation: RelationMetadata
  ): string[] {
    const joinColumnNames = new Set(
      (relation.joinColumns ?? []).map((column) => column.databaseName)
    );
    return (meta.columns ?? [])
      .filter(
        (column) =>
          joinColumnNames.has(column.databaseName) &&
          column.propertyName !== relation.propertyName
      )
      .map((column) => column.propertyName);
  }

  /** The ID in an exported pointer: a bare ID or `{ id }`. */
  private idOf(value: unknown): unknown {
    if (typeof value === 'number' || typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'id' in value) {
      return (value as { id: unknown }).id;
    }
    return undefined;
  }
}
