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
    const { children, indegree } = this.buildGraph(entityNames, metasByName);
    const ordered = this.performTopologicalSort(
      entityNames,
      children,
      indegree
    );
    this.ensureCompleteOrdering(entityNames, ordered);
    this.applyHeuristics(ordered);
    return ordered;
  }

  private buildGraph(
    entityNames: string[],
    metasByName: Map<string, EntityMetadata>
  ): { children: Map<string, Set<string>>; indegree: Map<string, number> } {
    const children: Map<string, Set<string>> = new Map();
    const indegree: Map<string, number> = new Map();
    for (const n of entityNames) {
      children.set(n, new Set());
      indegree.set(n, 0);
    }

    for (const childName of entityNames) {
      const meta = metasByName.get(childName);
      if (!meta) continue;
      for (const rel of meta.relations)
        this.processRelation(rel, childName, entityNames, children, indegree);
    }
    return { children, indegree };
  }

  private processRelation(
    rel: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    childName: string,
    entityNames: string[],
    children: Map<string, Set<string>>,
    indegree: Map<string, number>
  ): void {
    if (!this.isOwningSide(rel)) return;
    const parentName = rel.inverseEntityMetadata?.name;
    if (!parentName) return;
    if (!entityNames.includes(parentName)) return;
    if (parentName === childName) return;
    const set = children.get(parentName);
    if (!set) return;
    if (!set.has(childName)) {
      set.add(childName);
      indegree.set(childName, (indegree.get(childName) || 0) + 1);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isOwningSide(rel: any): boolean {
    // RelationMetadata API differences: use optional chaining defensively
    const anyRel: any = rel; // eslint-disable-line @typescript-eslint/no-explicit-any
    const hasJoinColumns =
      Array.isArray(anyRel?.joinColumns) && anyRel.joinColumns.length > 0;
    return Boolean(
      anyRel?.isManyToOne ||
        anyRel?.isOneToOneOwner ||
        anyRel?.relationType === 'many-to-one' ||
        (anyRel?.relationType === 'one-to-one' &&
          (anyRel?.isOwning || hasJoinColumns))
    );
  }

  private performTopologicalSort(
    entityNames: string[],
    children: Map<string, Set<string>>,
    indegree: Map<string, number>
  ): string[] {
    const queue = entityNames.filter((n) => (indegree.get(n) || 0) === 0);
    queue.sort((a, b) => a.localeCompare(b));
    const ordered: string[] = [];
    while (queue.length) {
      const n = queue.shift();
      if (!n) break;
      ordered.push(n);
      const kids = Array.from(children.get(n) || []);
      kids.sort((a, b) => a.localeCompare(b));
      for (const k of kids) this.decrementIndegreeAndQueue(k, indegree, queue);
    }
    return ordered;
  }

  private decrementIndegreeAndQueue(
    name: string,
    indegree: Map<string, number>,
    queue: string[]
  ): void {
    const current = indegree.get(name) ?? 0;
    const next = current - 1;
    indegree.set(name, next);
    if (next === 0) this.insertSorted(queue, name);
  }

  private insertSorted(queue: string[], name: string): void {
    const idx = queue.findIndex((q) => q.localeCompare(name) > 0);
    if (idx === -1) queue.push(name);
    else queue.splice(idx, 0, name);
  }

  private ensureCompleteOrdering(
    entityNames: string[],
    ordered: string[]
  ): void {
    if (ordered.length === entityNames.length) return;
    this.logger.warn(
      'Cycle detected in entity dependency graph. Falling back to partial ordering.'
    );
    for (const n of entityNames) if (!ordered.includes(n)) ordered.push(n);
  }

  private applyHeuristics(ordered: string[]): void {
    const projIdx = ordered.indexOf('ProjectEntity');
    const testIdx = ordered.indexOf('TestEventEntity');
    if (projIdx === -1 || testIdx === -1) return;
    if (testIdx === projIdx + 1) return; // already correct
    // Move TestEventEntity immediately after ProjectEntity
    ordered.splice(testIdx, 1);
    ordered.splice(projIdx + 1, 0, 'TestEventEntity');
  }
}
