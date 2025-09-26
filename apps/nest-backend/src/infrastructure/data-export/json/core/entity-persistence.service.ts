import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata, ObjectLiteral, Repository } from 'typeorm';
import { RelationMapperService } from './relation-mapper.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ImportStats } from '../../interfaces/import-types';

/**
 * Handles generic entity persistence (non-Project special cases) and alternate key registration.
 */
@Injectable()
export class EntityPersistenceService {
  private readonly logger = new Logger(EntityPersistenceService.name);
  constructor(
    private readonly relationMapper: RelationMapperService,
    private readonly idMapRegistry: IdMapRegistryService
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
      // Upsert logic for entities that have a strict 1:1 relationship with a parent (project or testEvent).
      // These previously caused unique constraint violations and were counted as skipped. We proactively
      // detect an existing row and update it instead so the import shows as inserted (imported).
      const singlePerParent: Record<string, string> = {
        ApplicationSettingEntity: 'project',
        AuthenticationSettingEntity: 'project',
        BrowserSettingEntity: 'project',
        RecordingEntity: 'testEvent',
        SpecEntity: 'testEvent',
        ItemDefEntity: 'testEvent'
      };
      const relationProp = singlePerParent[meta.name];
      if (process.env.IMPORT_DEBUG) {
        this.logger.debug(
          `[IMPORT_DEBUG] Begin persist for ${meta.name} relationProp=${relationProp} primaryIsSingle=${primaryIsSingle} pkProp=${primaryKeyProp}`
        );
      }
      if (relationProp) {
        // Relation mapper normally normalizes relation as { id: <fk> }
        const relVal = materialized[relationProp];
        // Accept either { id } object or an id primitive (fallback)
        const relId =
          typeof relVal === 'object' &&
          relVal &&
          'id' in (relVal as Record<string, unknown>)
            ? (relVal as Record<string, unknown>)['id']
            : relVal;
        if (process.env.IMPORT_DEBUG) {
          this.logger.debug(
            `[IMPORT_DEBUG] Upsert check ${meta.name} relId=${String(relId)} rawPk=${primaryKeyProp ? raw[primaryKeyProp] : 'n/a'}`
          );
        }
        if (relId != null) {
          try {
            // Find existing entity for that parent relation
            const existing = await repo.findOne({
              where: {
                [relationProp]: { id: relId }
              } as unknown as ObjectLiteral
            });
            if (existing) {
              if (process.env.IMPORT_DEBUG) {
                this.logger.debug(
                  `[IMPORT_DEBUG] Found existing ${meta.name} for relId=${String(relId)} performing update`
                );
              }
              // Map old pk (if provided) to existing id for downstream relation resolution
              if (primaryIsSingle && primaryKeyProp) {
                const oldPk = raw[primaryKeyProp];
                const existingPk = (existing as Record<string, unknown>)[
                  primaryKeyProp
                ];
                if (oldPk != null && existingPk != null) {
                  this.idMapRegistry.ensure(meta.name).set(oldPk, existingPk);
                  existingIds?.add(existingPk);
                }
              }
              // Merge new materialized values (excluding primary key) into existing entity
              const clone = { ...materialized };
              if (primaryIsSingle && primaryKeyProp)
                delete clone[primaryKeyProp];
              Object.assign(existing as Record<string, unknown>, clone);
              await repo.save(existing);
              if (process.env.IMPORT_DEBUG) {
                this.logger.debug(
                  `[IMPORT_DEBUG] Updated existing ${meta.name} id=${primaryKeyProp ? (existing as Record<string, unknown>)[primaryKeyProp] : 'n/a'}`
                );
              }
              this.registerAlternateKeys(
                meta,
                existing as Record<string, unknown>,
                primaryKeyProp
              );
              try {
                const exportRef =
                  raw['__exportRef'] ?? materialized['__exportRef'];
                if (exportRef != null && primaryKeyProp) {
                  const pkVal = (existing as Record<string, unknown>)[
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
              stats.inserted++; // Treat update as a successful import
              return;
            }
          } catch (lookupErr) {
            this.logger.debug(
              `Upsert lookup failed for ${meta.name}: ${(lookupErr as Error).message}`
            );
          }
        }
      }
      if (primaryIsSingle && primaryKeyProp)
        delete materialized[primaryKeyProp];
      const entityInstance = repo.create(materialized);
      if (process.env.IMPORT_DEBUG) {
        this.logger.debug(
          `[IMPORT_DEBUG] Creating new ${meta.name} (after upsert path) materializedKeys=${Object.keys(materialized).join(',')}`
        );
      }
      await repo.save(entityInstance);
      if (primaryIsSingle && primaryKeyProp) {
        const newPk = (entityInstance as Record<string, unknown>)[
          primaryKeyProp
        ];
        const oldPk = raw[primaryKeyProp];
        if (newPk != null) {
          if (oldPk != null)
            this.idMapRegistry.ensure(meta.name).set(oldPk, newPk);
          existingIds?.add(newPk);
        }
      }
      this.registerAlternateKeys(
        meta,
        entityInstance as Record<string, unknown>,
        primaryKeyProp
      );
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
      stats.inserted++;
    } catch (e) {
      // Add richer diagnostics for debugging why rows are skipped, including a compact view of the raw row
      const err = e as Error;
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
}
