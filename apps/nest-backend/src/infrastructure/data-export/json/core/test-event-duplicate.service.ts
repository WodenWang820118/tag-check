import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata, ObjectLiteral, Repository } from 'typeorm';
import { IdMapRegistryService } from './id-map-registry.service';

/**
 * Encapsulates duplicate detection logic for TestEventEntity using composite
 * (projectId,eventId) uniqueness.
 */
@Injectable()
export class TestEventDuplicateService {
  private readonly logger = new Logger(TestEventDuplicateService.name);
  constructor(private readonly idMapRegistry: IdMapRegistryService) {}

  async prefetchExistingComposite(
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>
  ): Promise<Map<string, unknown> | null> {
    if (meta.name !== 'TestEventEntity') return null;
    try {
      let existing: Array<Record<string, unknown>> = [];
      try {
        existing = await repo
          .createQueryBuilder('te')
          .leftJoin('te.project', 'p')
          .select('te.id', 'id')
          .addSelect('te.eventId', 'eventId')
          .addSelect('p.id', 'projectId')
          .getRawMany();
      } catch {
        const fallback = (await repo.find({
          relations: ['project']
        } as Record<string, unknown>)) as Array<Record<string, unknown>>;
        existing = fallback.map((fRaw) => {
          const f = fRaw;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const proj = f['project'] as Record<string, any> | undefined;
          return {
            id: f['id'],
            eventId: f['eventId'],
            projectId: proj ? proj['id'] : undefined
          } as Record<string, unknown>;
        });
      }
      return new Map(
        existing
          .filter(
            (e) =>
              typeof e['eventId'] === 'string' &&
              (typeof e['projectId'] === 'number' ||
                typeof e['projectId'] === 'string')
          )
          .map((e) => [`${e['projectId']}::${e['eventId'] as string}`, e['id']])
      );
    } catch (err) {
      this.logger.debug(
        `Could not prefetch existing composite eventIds: ${(err as Error).message}`
      );
      return null;
    }
  }

  /**
   * Returns true if row should be skipped, and wires idMap if we can map old -> existing pk.
   */
  handleDuplicate(
    meta: EntityMetadata,
    raw: Record<string, unknown>,
    materialized: Record<string, unknown>,
    existingComposite: Map<string, unknown> | null,
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string }
  ): boolean {
    // Only concerned with TestEventEntity composite uniqueness checks
    if (meta.name !== 'TestEventEntity' || !existingComposite) return false;
    const incomingEventId = materialized['eventId'];
    const owningProjectId = materialized['projectId'];
    if (
      typeof incomingEventId === 'string' &&
      (typeof owningProjectId === 'number' ||
        typeof owningProjectId === 'string')
    ) {
      // Use String() to convert primitives safely. Avoid JSON.stringify which
      // can coerce objects without a proper toString implementation.
      const compositeKey = `${String(owningProjectId)}::${incomingEventId}`;
      if (existingComposite.has(compositeKey)) {
        // We intentionally DO NOT skip duplicates. The import semantics allow
        // inserting another TestEvent row with the same (projectId, eventId).
        // Still, if possible, wire the old -> existing pk mapping for downstream
        // relations, but proceed with insertion.
        const existingPk = existingComposite.get(compositeKey);
        const { primaryIsSingle, primaryKeyProp } = pkInfo;
        if (primaryIsSingle && primaryKeyProp) {
          const oldPk = raw[primaryKeyProp];
          if (oldPk != null && existingPk != null) {
            this.idMapRegistry.ensure(meta.name).set(oldPk, existingPk);
          }
        }
        // If caller explicitly requested skipping duplicates (via either the
        // original raw values or the materialized row), honor that and return
        // true to indicate the row should be skipped. Otherwise, continue to
        // allow insertion by returning false.
        const skipFlagRaw = raw['skipIfDuplicate'];
        const skipFlagMaterialized = materialized['skipIfDuplicate'];
        const shouldSkip =
          skipFlagRaw === true || skipFlagMaterialized === true;
        return shouldSkip;
      }
    }
    return false;
  }
}
