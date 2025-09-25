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

  async importProjectRows(
    rows: unknown[],
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string },
    stats: ImportStats,
    idMaps: Record<string, Map<unknown, unknown>>
  ): Promise<unknown> {
    const { primaryIsSingle, primaryKeyProp } = pkInfo;
    let newProjectId: unknown = undefined;
    for (const raw of rows as Array<Record<string, unknown>>) {
      const materialized = this.materializer.materialize(raw, meta) as Record<
        string,
        unknown
      >;
      const incomingSlug = materialized['projectSlug'] as string | undefined;
      if (!incomingSlug) {
        this.logger.warn('Skipping project row without projectSlug');
        stats.skipped++;
        continue;
      }

      // Because slug is immutable, attempt to locate an existing project by slug.
      const existing = await repo.findOne({
        where: { projectSlug: incomingSlug } as unknown as Record<
          string,
          unknown
        >
      });

      if (existing) {
        // Update path: merge mutable fields (exclude primary key + slug)
        const clone = { ...materialized };
        if (primaryIsSingle && primaryKeyProp) delete clone[primaryKeyProp];
        delete clone['projectSlug']; // slug immutable
        Object.assign(existing as Record<string, unknown>, clone);
        await repo.save(existing);
        const existingPk =
          primaryIsSingle && primaryKeyProp
            ? (existing as Record<string, unknown>)[primaryKeyProp]
            : undefined;
        if (existingPk != null) {
          newProjectId = existingPk;
          const oldPk = raw[primaryKeyProp];
          if (oldPk != null)
            this.idMapRegistry.set(meta.name, oldPk, existingPk);
        }
        // Register slug -> id (idempotent) + exportRef if present
        this.relationMapper.register(meta.name, incomingSlug, existingPk);
        try {
          const exportRef = raw['__exportRef'] ?? materialized['__exportRef'];
          if (exportRef != null && existingPk != null) {
            this.relationMapper.register(meta.name, exportRef, existingPk);
          }
        } catch (err) {
          this.logger.debug(
            `Project exportRef registration failed: ${(err as Error).message}`
          );
        }
        stats.inserted++; // treat update as inserted
        continue;
      }

      // Create path (generate unique slug if collision is found, though immutable means first-project creation sets it)
      const uniqueSlug = await this.slugService.ensureUnique(
        repo,
        incomingSlug
      );
      materialized['projectSlug'] = uniqueSlug;
      if (primaryIsSingle && primaryKeyProp)
        delete materialized[primaryKeyProp];
      const entityInstance = repo.create(materialized);
      await repo.save(entityInstance);
      if (primaryIsSingle && primaryKeyProp) {
        const newPk = (entityInstance as Record<string, unknown>)[
          primaryKeyProp
        ];
        newProjectId = newPk;
        const oldPk = raw[primaryKeyProp];
        if (oldPk != null) this.idMapRegistry.set(meta.name, oldPk, newPk);
        this.relationMapper.register(meta.name, uniqueSlug, newPk);
        try {
          const exportRef = raw['__exportRef'] ?? materialized['__exportRef'];
          if (exportRef != null)
            this.relationMapper.register(meta.name, exportRef, newPk);
        } catch (err) {
          this.logger.debug(
            `Project exportRef registration failed: ${(err as Error).message}`
          );
        }
      }
      stats.inserted++;
    }
    if (!idMaps[meta.name])
      idMaps[meta.name] = this.idMapRegistry.ensure(meta.name);
    return newProjectId;
  }
}
