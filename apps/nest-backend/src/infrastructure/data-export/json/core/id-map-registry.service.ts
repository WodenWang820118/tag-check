import { Injectable } from '@nestjs/common';

/**
 * The ID remapping of one import: for each entity, the exported primary key
 * of a row and the key it has in this database (new, or the existing row it
 * was merged into). Also remembers which rows the import created, as
 * opposed to rows that already existed. The import transaction clears it
 * before each import.
 */
@Injectable()
export class IdMapRegistryService {
  // entityName -> Map(oldId -> newId)
  private readonly maps: Record<string, Map<unknown, unknown>> = {};
  // entityName -> primary keys of the rows this import inserted
  private readonly created: Record<string, Set<unknown>> = {};

  ensure(entityName: string): Map<unknown, unknown> {
    if (!this.maps[entityName]) this.maps[entityName] = new Map();
    return this.maps[entityName];
  }

  set(entityName: string, oldId: unknown, newId: unknown): void {
    if (oldId == null || newId == null) return;
    this.ensure(entityName).set(oldId, newId);
  }

  get(entityName: string, oldId: unknown): unknown {
    return this.maps[entityName]?.get(oldId);
  }

  has(entityName: string, oldId: unknown): boolean {
    return this.maps[entityName]?.has(oldId) ?? false;
  }

  getAll(): Record<string, Map<unknown, unknown>> {
    return this.maps;
  }

  /** Records that this import inserted the row with this primary key. */
  markCreated(entityName: string, id: unknown): void {
    if (id == null) return;
    this.created[entityName] ??= new Set();
    this.created[entityName].add(id);
  }

  /** Whether this import inserted the row, rather than finding it. */
  wasCreated(entityName: string, id: unknown): boolean {
    return this.created[entityName]?.has(id) ?? false;
  }

  clear(): void {
    for (const k of Object.keys(this.maps)) delete this.maps[k];
    for (const k of Object.keys(this.created)) delete this.created[k];
  }
}
