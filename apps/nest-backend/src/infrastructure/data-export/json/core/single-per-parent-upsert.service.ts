import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata, ObjectLiteral, Repository } from 'typeorm';
import { RelationMapperService } from './relation-mapper.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ImportStats } from '../../interfaces/import-types';

export interface UpsertContext {
  primaryIsSingle: boolean;
  primaryKeyProp?: string;
  existingIds: Set<unknown> | null;
  stats: ImportStats;
  raw: Record<string, unknown>;
}

@Injectable()
export class SinglePerParentUpsertService {
  private readonly logger = new Logger(SinglePerParentUpsertService.name);
  constructor(
    private readonly relationMapper: RelationMapperService,
    private readonly idMapRegistry: IdMapRegistryService
  ) {}

  getRelationProp(entityName: string): string | undefined {
    const singlePerParent: Record<string, string> = {
      ApplicationSettingEntity: 'project',
      AuthenticationSettingEntity: 'project',
      BrowserSettingEntity: 'project',
      RecordingEntity: 'testEvent',
      SpecEntity: 'testEvent',
      ItemDefEntity: 'testEvent'
    };
    return singlePerParent[entityName];
  }

  async tryUpsert(
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    materialized: Record<string, unknown>,
    ctx: UpsertContext
  ): Promise<boolean> {
    const relationProp = this.getRelationProp(meta.name);
    if (!relationProp) return false;
    const relId = this.extractRelationId(materialized[relationProp]);
    if (relId == null) return false;
    if (process.env.IMPORT_DEBUG) {
      this.logger.debug(
        `[IMPORT_DEBUG] Upsert check ${meta.name} relId=${JSON.stringify(relId)} rawPk=${ctx.primaryKeyProp ? JSON.stringify(ctx.raw[ctx.primaryKeyProp]) : 'n/a'}`
      );
    }
    try {
      const existing = await repo.findOne({
        where: { [relationProp]: { id: relId } } as unknown as ObjectLiteral
      });
      if (!existing) return false;
      if (process.env.IMPORT_DEBUG) {
        this.logger.debug(
          `[IMPORT_DEBUG] Found existing ${meta.name} for relId=${JSON.stringify(relId)} performing update`
        );
      }
      this.mapOldPkToExisting(meta, existing as Record<string, unknown>, ctx);
      await this.mergeAndSaveExisting(repo, existing, materialized, ctx);
      this.registerExportRef(
        meta,
        ctx.raw,
        materialized,
        existing,
        ctx.primaryKeyProp
      );
      ctx.stats.inserted++;
      return true;
    } catch (e) {
      this.logger.debug(
        `Upsert lookup failed for ${meta.name}: ${(e as Error).message}`
      );
      return false;
    }
  }

  private extractRelationId(relVal: unknown): unknown {
    if (
      typeof relVal === 'object' &&
      relVal &&
      'id' in (relVal as Record<string, unknown>)
    ) {
      return (relVal as Record<string, unknown>)['id'];
    }
    return relVal;
  }

  private mapOldPkToExisting(
    meta: EntityMetadata,
    existing: Record<string, unknown>,
    ctx: UpsertContext
  ) {
    if (!(ctx.primaryIsSingle && ctx.primaryKeyProp)) return;
    const oldPk = ctx.raw[ctx.primaryKeyProp];
    const existingPk = existing[ctx.primaryKeyProp];
    if (oldPk != null && existingPk != null) {
      this.idMapRegistry.ensure(meta.name).set(oldPk, existingPk);
      ctx.existingIds?.add(existingPk);
    }
  }

  private async mergeAndSaveExisting(
    repo: Repository<ObjectLiteral>,
    existing: ObjectLiteral,
    materialized: Record<string, unknown>,
    ctx: UpsertContext
  ) {
    const clone = { ...materialized };
    if (ctx.primaryIsSingle && ctx.primaryKeyProp)
      delete clone[ctx.primaryKeyProp];
    Object.assign(existing as Record<string, unknown>, clone);
    await repo.save(existing);
    if (process.env.IMPORT_DEBUG) {
      this.logger.debug(
        `[IMPORT_DEBUG] Updated existing ${(existing as Record<string, unknown>).constructor?.name} id=${
          ctx.primaryKeyProp
            ? JSON.stringify(
                (existing as Record<string, unknown>)[ctx.primaryKeyProp]
              )
            : 'n/a'
        }`
      );
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
        `ExportRef registration (update path) failed for ${meta.name}: ${(err as Error).message}`
      );
    }
  }
}
