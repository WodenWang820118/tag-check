import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';

@Injectable()
export class TopologicalSorterService {
  private readonly logger = new Logger(TopologicalSorterService.name);

  order(
    env: FixtureEnvelopeV1,
    metasByName: Map<string, EntityMetadata>
  ): string[] {
    const entityNames = Object.keys(env.entities);
    const children: Map<string, Set<string>> = new Map();
    const indegree: Map<string, number> = new Map();
    entityNames.forEach((n) => {
      children.set(n, new Set());
      indegree.set(n, 0);
    });

    for (const potentialChild of entityNames) {
      const meta = metasByName.get(potentialChild);
      if (!meta) continue;
      for (const rel of meta.relations) {
        const r: any = rel; // eslint-disable-line @typescript-eslint/no-explicit-any
        const hasJoinColumns =
          Array.isArray(r.joinColumns) && r.joinColumns.length > 0;
        const isOwning = !!(
          r.isManyToOne ||
          r.isOneToOneOwner ||
          r.relationType === 'many-to-one' ||
          (r.relationType === 'one-to-one' && (r.isOwning || hasJoinColumns))
        );
        if (!isOwning) continue;
        const parentName = rel.inverseEntityMetadata?.name;
        if (!parentName) continue;
        if (!entityNames.includes(parentName)) continue;
        if (parentName === potentialChild) continue;
        const set = children.get(parentName);
        if (!set) continue;
        if (!set.has(potentialChild)) {
          set.add(potentialChild);
          indegree.set(potentialChild, (indegree.get(potentialChild) || 0) + 1);
        }
      }
    }

    const queue: string[] = entityNames.filter(
      (n) => (indegree.get(n) || 0) === 0
    );
    queue.sort();

    const ordered: string[] = [];
    while (queue.length) {
      const n = queue.shift();
      if (!n) break;
      ordered.push(n);
      const kids = Array.from(children.get(n) || []);
      kids.sort();
      for (const k of kids) {
        const current = indegree.get(k) ?? 0;
        const next = current - 1;
        indegree.set(k, next);
        if (next === 0) {
          const idx = queue.findIndex((q) => q.localeCompare(k) > 0);
          if (idx === -1) queue.push(k);
          else queue.splice(idx, 0, k);
        }
      }
    }

    if (ordered.length < entityNames.length) {
      this.logger.warn(
        'Cycle detected in entity dependency graph. Falling back to partial ordering.'
      );
      for (const n of entityNames) if (!ordered.includes(n)) ordered.push(n);
    }
    // Heuristic: ensure TestEventEntity precedes its typical dependents (Recording/Spec/ItemDef)
    const projIdx = ordered.indexOf('ProjectEntity');
    const testIdx = ordered.indexOf('TestEventEntity');
    if (testIdx !== -1 && projIdx !== -1 && testIdx < projIdx) {
      // move test event after project
      ordered.splice(testIdx, 1);
      ordered.splice(projIdx + 1, 0, 'TestEventEntity');
    } else if (testIdx !== -1 && projIdx !== -1 && testIdx > projIdx + 1) {
      ordered.splice(testIdx, 1);
      ordered.splice(projIdx + 1, 0, 'TestEventEntity');
    }
    return ordered;
  }
}
