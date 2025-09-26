import { Injectable } from '@nestjs/common';

@Injectable()
export class IdMapRegistryService {
  // entityName -> Map(oldId -> newId)
  private readonly maps: Record<string, Map<unknown, unknown>> = {};

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

  clear(): void {
    for (const k of Object.keys(this.maps)) delete this.maps[k];
  }
}
