import { Injectable, Logger, Optional } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ImportStats } from '../../interfaces/import-types';
import { ProjectIdAssignerService } from './project-id-assigner.service';
import { ExistingIdCollisionService } from './existing-id-collision.service';

/**
 * Prepares one materialized row before it is persisted: assigns the new
 * project ID, drops a test's exported primary key, wires duplicate tests to
 * the existing ones, and decides whether a primary key collision means the
 * row is already in the database.
 */
@Injectable()
export class ImportRowProcessorService {
  private readonly logger = new Logger(ImportRowProcessorService.name);
  private readonly existingIdCollision: ExistingIdCollisionService;

  constructor(
    private readonly testEventDupService: TestEventDuplicateService,
    private readonly idMapRegistry: IdMapRegistryService,
    @Optional() private readonly projectIdAssigner?: ProjectIdAssignerService,
    @Optional() existingIdCollision?: ExistingIdCollisionService
  ) {
    this.existingIdCollision =
      existingIdCollision ?? new ExistingIdCollisionService();
  }

  /**
   * Pre-processes a materialized row in place.
   *
   * @returns `true` when the caller should skip persisting the row (its
   * primary key already exists and it cannot be upserted), otherwise `false`.
   */
  preProcessRow(params: {
    raw: Record<string, unknown>;
    materialized: Record<string, unknown>;
    meta: EntityMetadata;
    name: string;
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string };
    existingIds: Set<unknown> | null;
    existingCompositeEventMap: Map<string, unknown> | null;
    ctx: {
      exportedProjectId: unknown;
      newProjectId: unknown;
      stats: Record<string, ImportStats>;
      idMaps: Record<string, Map<unknown, unknown>>;
    };
  }): boolean {
    const {
      raw,
      materialized,
      meta,
      name,
      pkInfo,
      existingIds,
      existingCompositeEventMap,
      ctx
    } = params;

    this.projectIdAssigner?.assignIfApplicable({
      materialized,
      meta,
      newProjectId: ctx.newProjectId
    });

    // A test always gets a new primary key: (project, eventId) identifies it,
    // and its exported ID may belong to another project's test here.
    if (
      meta.name === 'TestEventEntity' &&
      pkInfo.primaryIsSingle &&
      pkInfo.primaryKeyProp
    ) {
      delete materialized[pkInfo.primaryKeyProp];
    }

    // A duplicate test is not skipped here: its exported ID is mapped to the
    // existing test, and inserting it fails on the unique (project, eventId)
    // index, which the persistence step counts as a skip.
    this.testEventDupService.handleDuplicate(
      meta,
      raw,
      materialized,
      existingCompositeEventMap,
      pkInfo
    );

    if (!pkInfo.primaryIsSingle || !existingIds || !pkInfo.primaryKeyProp) {
      return false;
    }
    const pkVal = materialized[pkInfo.primaryKeyProp];
    if (pkVal == null || !existingIds.has(pkVal)) return false;
    // A row of a parent this import created cannot exist yet: the matching
    // primary key belongs to an unrelated row, such as another project's
    // run, so the row is inserted with a new key instead of skipped.
    if (this.belongsToCreatedParent(meta, raw)) return false;

    return this.existingIdCollision.handleCollision({
      metaName: meta.name,
      pkVal,
      rawPkVal: raw[pkInfo.primaryKeyProp],
      idMap: (oldPk, newPk) => this.idMapRegistry.set(name, oldPk, newPk),
      incrementSkipStat: () => ctx.stats[name].skipped++,
      importDebug: Boolean(process.env.IMPORT_DEBUG)
    });
  }

  /** Whether a parent the row points at was inserted by this import. */
  private belongsToCreatedParent(
    meta: EntityMetadata,
    raw: Record<string, unknown>
  ): boolean {
    return (meta.relations ?? []).some((relation) => {
      if (!(relation.isManyToOne || relation.isOneToOneOwner)) return false;
      const parentName = relation.inverseEntityMetadata?.name;
      if (!parentName) return false;
      const value = raw[relation.propertyName];
      const exportedParentId =
        value && typeof value === 'object' && 'id' in value
          ? (value as { id: unknown }).id
          : value;
      if (exportedParentId == null) return false;
      const parentId = this.idMapRegistry.get(parentName, exportedParentId);
      return (
        parentId != null && this.idMapRegistry.wasCreated(parentName, parentId)
      );
    });
  }
}
