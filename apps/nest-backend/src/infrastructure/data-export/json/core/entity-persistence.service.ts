import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata, ObjectLiteral, Repository } from 'typeorm';
import { RelationMapperService } from './relation-mapper.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ImportStats } from '../../interfaces/import-types';
import {
  SinglePerParentUpsertService,
  UpsertContext
} from './single-per-parent-upsert.service';

/**
 * Handles generic entity persistence (non-Project special cases) and alternate key registration.
 */
@Injectable()
export class EntityPersistenceService {
  private readonly logger = new Logger(EntityPersistenceService.name);
  constructor(
    private readonly relationMapper: RelationMapperService,
    private readonly idMapRegistry: IdMapRegistryService,
    private readonly singlePerParentUpsert: SinglePerParentUpsertService
  ) {}

  registerAlternateKeys(
    meta: EntityMetadata,
    entityInstance: Record<string, unknown>,
    primaryKeyProp?: string
  ) {
    try {
      if (meta.name === 'TestEventEntity') {
        const evId = entityInstance['eventId'];
        if (primaryKeyProp) {
          const pkVal = entityInstance[primaryKeyProp];
          if (evId != null && pkVal != null) {
            this.relationMapper.register(meta.name, evId, pkVal);
          }
        }
      }
    } catch (err) {
      this.logger.debug(
        `Indexer registration failed for ${meta.name}: ${(err as Error).message}`
      );
    }
  }

  async persistEntityAndRegister(
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    materialized: Record<string, unknown>,
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string },
    ctx: {
      existingIds: Set<unknown> | null;
      stats: ImportStats;
    },
    raw: Record<string, unknown>
  ) {
    const { primaryIsSingle, primaryKeyProp } = pkInfo;
    const { existingIds, stats } = ctx;
    try {
      this.logImportBegin(meta, primaryIsSingle, primaryKeyProp);
      const upsertCtx: UpsertContext = {
        primaryIsSingle,
        primaryKeyProp,
        existingIds,
        stats,
        raw
      };
      const upserted = await this.singlePerParentUpsert.tryUpsert(
        meta,
        repo,
        materialized,
        upsertCtx
      );
      if (upserted) return;
      await this.createAndPersistNewEntity(meta, repo, materialized, upsertCtx);
    } catch (e) {
      this.handlePersistError(e as Error, meta, raw, stats);
    }
  }
  private logImportBegin(
    meta: EntityMetadata,
    primaryIsSingle: boolean,
    primaryKeyProp?: string
  ) {
    if (process.env.IMPORT_DEBUG) {
      this.logger.debug(
        `[IMPORT_DEBUG] Begin persist for ${meta.name} primaryIsSingle=${primaryIsSingle} pkProp=${primaryKeyProp}`
      );
    }
  }

  private async createAndPersistNewEntity(
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    materialized: Record<string, unknown>,
    ctx: UpsertContext
  ) {
    const { primaryIsSingle, primaryKeyProp } = ctx;
    if (primaryIsSingle && primaryKeyProp) delete materialized[primaryKeyProp];
    const entityInstance = repo.create(materialized);
    if (process.env.IMPORT_DEBUG) {
      this.logger.debug(
        `[IMPORT_DEBUG] Creating new ${meta.name} (after upsert path) materializedKeys=${Object.keys(materialized).join(',')}`
      );
    }
    await repo.save(entityInstance);
    this.mapNewPk(meta, entityInstance, ctx);
    this.registerAlternateKeys(
      meta,
      entityInstance as Record<string, unknown>,
      primaryKeyProp
    );
    this.registerExportRef(
      meta,
      ctx.raw,
      materialized,
      entityInstance,
      primaryKeyProp
    );
    ctx.stats.inserted++;
  }

  private mapNewPk(
    meta: EntityMetadata,
    entityInstance: ObjectLiteral,
    ctx: UpsertContext
  ) {
    const { primaryIsSingle, primaryKeyProp, raw, existingIds } = ctx;
    if (!(primaryIsSingle && primaryKeyProp)) return;
    const newPk = (entityInstance as Record<string, unknown>)[primaryKeyProp];
    const oldPk = raw[primaryKeyProp];
    if (newPk != null) {
      if (oldPk != null) this.idMapRegistry.ensure(meta.name).set(oldPk, newPk);
      existingIds?.add(newPk);
    }
  }

  private registerExportRef(
    meta: EntityMetadata,
    raw: Record<string, unknown>,
    materialized: Record<string, unknown>,
    entityInstance: ObjectLiteral,
    primaryKeyProp: string | undefined
  ) {
    try {
      const exportRef = raw['__exportRef'] ?? materialized['__exportRef'];
      if (exportRef != null && primaryKeyProp) {
        const pkVal = (entityInstance as Record<string, unknown>)[
          primaryKeyProp
        ];
        if (pkVal != null)
          this.relationMapper.register(meta.name, exportRef, pkVal);
      }
    } catch (err) {
      this.logger.debug(
        `ExportRef registration failed for ${meta.name}: ${(err as Error).message}`
      );
    }
  }

  private handlePersistError(
    err: Error,
    meta: EntityMetadata,
    raw: Record<string, unknown>,
    stats: ImportStats
  ) {
    let diagnostic = '';
    try {
      const compactRaw = Object.fromEntries(
        Object.entries(raw).filter(
          ([k]) => !k.toLowerCase().includes('password')
        )
      );
      diagnostic = JSON.stringify(compactRaw).slice(0, 500);
    } catch {
      // ignore JSON issues
    }
    if (process.env.IMPORT_DEBUG) {
      this.logger.error(
        `[IMPORT_DEBUG] Error persisting ${meta.name}: ${err.name} ${err.message}`
      );
    }
    this.logger.debug(
      `Skipping row for ${meta.name}: ${err.message}${diagnostic ? ' raw=' + diagnostic : ''}`
    );
    stats.skipped++;
  }
}
