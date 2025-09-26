import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata, ObjectLiteral, Repository } from 'typeorm';
import { RowMaterializerService } from './row-materializer.service';
import { ProjectSlugService } from './project-slug.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { RelationMapperService } from './relation-mapper.service';
import { ImportStats } from '../../interfaces/import-types';

/**
 * Handles importing of ProjectEntity rows, slug uniqueness and registration
 * of alternate keys (slug + exportRef).
 */
@Injectable()
export class ProjectImportService {
  private readonly logger = new Logger(ProjectImportService.name);
  constructor(
    private readonly materializer: RowMaterializerService,
    private readonly slugService: ProjectSlugService,
    private readonly idMapRegistry: IdMapRegistryService,
    private readonly relationMapper: RelationMapperService
  ) {}

  /**
   * Import project rows and return the last created/updated project id (if any).
   */
  async importProjectRows(
    rows: unknown[],
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string },
    stats: ImportStats,
    idMaps: Record<string, Map<unknown, unknown>>
  ): Promise<unknown> {
    let newProjectId: unknown = undefined;
    for (const raw of rows as Array<Record<string, unknown>>) {
      const materialized = this.materializer.materialize(raw, meta) as Record<
        string,
        unknown
      >;
      const incomingSlug = this.getIncomingSlug(materialized);

      if (!incomingSlug) {
        this.logger.warn('Skipping project row without projectSlug');
        stats.skipped++;
        continue;
      }

      const existing = await repo.findOne({
        where: { projectSlug: incomingSlug } as unknown as Record<
          string,
          unknown
        >
      });

      if (existing) {
        newProjectId = await this.updateExistingProject({
          existing,
          materialized,
          raw,
          meta,
          repo,
          pkInfo,
          slug: incomingSlug,
          stats
        });
        continue;
      }

      newProjectId = await this.createNewProject({
        materialized,
        raw,
        meta,
        repo,
        pkInfo,
        incomingSlug,
        stats
      });
    }
    if (!idMaps[meta.name])
      idMaps[meta.name] = this.idMapRegistry.ensure(meta.name);
    return newProjectId;
  }

  private getIncomingSlug(
    materialized: Record<string, unknown>
  ): string | undefined {
    return materialized['projectSlug'] as string | undefined;
  }

  private getPrimaryKey(
    obj: Record<string, unknown>,
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string }
  ): unknown {
    return pkInfo.primaryIsSingle && pkInfo.primaryKeyProp
      ? obj[pkInfo.primaryKeyProp]
      : undefined;
  }

  private deletePrimaryKey(
    target: Record<string, unknown>,
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string }
  ): void {
    if (pkInfo.primaryIsSingle && pkInfo.primaryKeyProp)
      delete target[pkInfo.primaryKeyProp];
  }

  private getExportRef(
    raw: Record<string, unknown>,
    materialized: Record<string, unknown>
  ): unknown {
    return raw['__exportRef'] ?? materialized['__exportRef'];
  }

  private registerSlug(metaName: string, slug: string, pk: unknown): void {
    this.relationMapper.register(metaName, slug, pk);
  }

  private safeRegisterExportRef(
    metaName: string,
    exportRef: unknown,
    pk: unknown
  ): void {
    try {
      this.relationMapper.register(metaName, exportRef, pk);
    } catch (err) {
      this.logger.debug(
        `Project exportRef registration failed: ${(err as Error).message}`
      );
    }
  }

  private async updateExistingProject(opts: {
    existing: ObjectLiteral;
    materialized: Record<string, unknown>;
    raw: Record<string, unknown>;
    meta: EntityMetadata;
    repo: Repository<ObjectLiteral>;
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string };
    slug: string;
    stats: ImportStats;
  }): Promise<unknown> {
    const { existing, materialized, raw, meta, repo, pkInfo, slug, stats } =
      opts;

    // Merge mutable fields (exclude primary key + slug)
    const clone = { ...materialized };
    this.deletePrimaryKey(clone, pkInfo);
    delete clone['projectSlug'];
    Object.assign(existing as Record<string, unknown>, clone);
    await repo.save(existing);

    const existingPk = this.getPrimaryKey(
      existing as Record<string, unknown>,
      pkInfo
    );
    if (existingPk != null) {
      const oldPk = pkInfo.primaryKeyProp
        ? raw[pkInfo.primaryKeyProp]
        : undefined;
      if (oldPk != null) this.idMapRegistry.set(meta.name, oldPk, existingPk);
    }

    // Register slug and (if present) exportRef
    this.registerSlug(meta.name, slug, existingPk);
    const exportRef = this.getExportRef(raw, materialized);
    if (exportRef != null && existingPk != null)
      this.safeRegisterExportRef(meta.name, exportRef, existingPk);

    stats.inserted++; // treat update as inserted
    return existingPk;
  }

  private async createNewProject(opts: {
    materialized: Record<string, unknown>;
    raw: Record<string, unknown>;
    meta: EntityMetadata;
    repo: Repository<ObjectLiteral>;
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string };
    incomingSlug: string;
    stats: ImportStats;
  }): Promise<unknown> {
    const { materialized, raw, meta, repo, pkInfo, incomingSlug, stats } = opts;

    // Ensure unique immutable slug for creation
    const uniqueSlug = await this.slugService.ensureUnique(repo, incomingSlug);
    materialized['projectSlug'] = uniqueSlug;
    this.deletePrimaryKey(materialized, pkInfo);

    const entityInstance = repo.create(materialized);
    await repo.save(entityInstance);

    const newPk: unknown = this.getPrimaryKey(
      entityInstance as Record<string, unknown>,
      pkInfo
    );
    if (newPk != null) {
      const oldPk = pkInfo.primaryKeyProp
        ? raw[pkInfo.primaryKeyProp]
        : undefined;
      if (oldPk != null) this.idMapRegistry.set(meta.name, oldPk, newPk);

      this.registerSlug(meta.name, uniqueSlug, newPk);
      const exportRef = this.getExportRef(raw, materialized);
      if (exportRef != null)
        this.safeRegisterExportRef(meta.name, exportRef, newPk);
    }

    stats.inserted++;
    return newPk;
  }
}
