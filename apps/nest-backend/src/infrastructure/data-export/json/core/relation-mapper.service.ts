import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';

@Injectable()
export class RelationMapperService {
  private readonly logger = new Logger(RelationMapperService.name);

  // internal alternate-key maps: entityName -> Map(altKey -> pk)
  private readonly maps: Record<string, Map<unknown, unknown>> = {};

  // --- IdIndexer-like methods (kept public to preserve existing usage) ---
  ensure(entityName: string) {
    if (!this.maps[entityName]) this.maps[entityName] = new Map();
    return this.maps[entityName];
  }

  register(entityName: string, altKey: unknown, pk: unknown) {
    if (altKey == null || pk == null) return;
    this.ensure(entityName).set(altKey, pk);
  }

  lookup(entityName: string, altKey: unknown): unknown {
    const m = this.maps[entityName];
    if (!m) return undefined as unknown;
    return m.get(altKey);
  }

  getMap(entityName: string): Map<unknown, unknown> | undefined {
    return this.maps[entityName];
  }

  // --- Relation mapping ---
  mapRelations(
    materialized: Record<string, unknown>,
    meta: EntityMetadata,
    projectId: unknown,
    idMaps?: Record<string, Map<unknown, unknown>>
  ) {
    // Early: if a projectSlug is present and no projectId, resolve it immediately so downstream relation logic sees normalized project reference.
    if (
      materialized['projectSlug'] != null &&
      materialized['projectId'] == null
    ) {
      const pk = this.lookup('ProjectEntity', materialized['projectSlug']);
      if (pk != null) materialized['projectId'] = pk;
    }
    type MinimalRelation = {
      isManyToOne?: boolean;
      isOneToOneOwner?: boolean;
      propertyName?: string;
      joinColumns?: Array<{
        databaseName?: string;
        propertyName?: string;
        name?: string;
      }>;
      inverseEntityMetadata?: { name?: string };
    };
    for (const r of meta.relations) {
      const relation = r as unknown as MinimalRelation;
      if (!(relation.isManyToOne || relation.isOneToOneOwner)) continue;

      const tryKeys = this.buildCandidateKeys(relation);
      let fkVal = this.extractFkFromKeys(materialized, tryKeys);

      fkVal ??= this.maybeTestEventFk(materialized, relation);

      this.applyResolvedFk(materialized, relation, fkVal, projectId, idMaps);
    }

    // --- Generic *Id field remapping (post relation-specific logic) ---
    // For any property that ends with 'Id' and whose value matches an old id in a known idMap,
    // rewrite to the new id. This is a fallback for FKs not captured by TypeORM relation metadata.
    if (idMaps) {
      for (const [prop, value] of Object.entries(materialized)) {
        if (!prop.endsWith('Id')) continue;
        if (value == null) continue;
        // Attempt to infer target entity name from prop (e.g., projectId -> ProjectEntity)
        const base = prop.substring(0, prop.length - 2); // remove 'Id'
        const candidateEntityNames = [
          `${base.charAt(0).toUpperCase()}${base.slice(1)}Entity`,
          `${base.charAt(0).toUpperCase()}${base.slice(1)}`
        ];
        let mapped: unknown = undefined;
        for (const c of candidateEntityNames) {
          const m = idMaps[c];
          if (m && m.has(value)) {
            mapped = m.get(value);
            break;
          }
        }
        if (mapped != null) {
          materialized[prop] = mapped as unknown;
        }
      }

      // Pass 2: resolve <entity>ExportRef -> <entity>Id if present
      for (const [prop, value] of Object.entries(materialized)) {
        if (!prop.endsWith('ExportRef')) continue;
        if (value == null) continue;
        const base = prop.substring(0, prop.length - 'ExportRef'.length);
        const candidateEntityNames = [
          `${base.charAt(0).toUpperCase()}${base.slice(1)}Entity`,
          `${base.charAt(0).toUpperCase()}${base.slice(1)}`
        ];
        let mapped: unknown = undefined;
        for (const c of candidateEntityNames) {
          const direct = this.lookup(c, value);
          if (direct != null) {
            mapped = direct;
            break;
          }
        }
        if (mapped != null) {
          const idProp = `${base}Id`;
          if (!(idProp in materialized)) materialized[idProp] = mapped;
        }
      }

      // Pass 3: detect embedded relation objects with __exportRef
      for (const [prop, value] of Object.entries(materialized)) {
        if (!value || typeof value !== 'object' || Array.isArray(value))
          continue;
        const refVal = (value as Record<string, unknown>)['__exportRef'];
        if (refVal == null) continue;
        // Try using prop name to infer entity
        const candidateEntityNames = [
          `${prop.charAt(0).toUpperCase()}${prop.slice(1)}Entity`,
          `${prop.charAt(0).toUpperCase()}${prop.slice(1)}`
        ];
        for (const c of candidateEntityNames) {
          const pk = this.lookup(c, refVal);
          if (pk != null) {
            (value as Record<string, unknown>)['id'] = pk;
            // Also surface an <prop>Id if not already present to aid downstream logic
            const idProp = `${prop}Id`;
            if (!(idProp in materialized)) materialized[idProp] = pk;
            break;
          }
        }
      }

      // Pass 4: if a standalone projectSlug is present on a row (legacy export style) and no projectId, resolve it.
      // (Previously handled early)
    }
  }

  private buildCandidateKeys(relation: {
    propertyName?: string;
    joinColumns?: Array<{
      databaseName?: string;
      propertyName?: string;
      name?: string;
    }>;
  }): string[] {
    const tryKeys: string[] = [];
    const joinCol = relation.joinColumns?.[0];
    if (joinCol) {
      const jc = joinCol as unknown as {
        databaseName?: string;
        propertyName?: string;
      };
      if (jc.databaseName) tryKeys.push(jc.databaseName);
      if (jc.propertyName) tryKeys.push(jc.propertyName);
    }
    if (relation.propertyName) {
      tryKeys.push(`${relation.propertyName}Id`);
      tryKeys.push(`${relation.propertyName}_id`);
      tryKeys.push(String(relation.propertyName));
    }
    return tryKeys;
  }

  private extractFkFromKeys(
    materialized: Record<string, unknown>,
    tryKeys: string[]
  ): unknown {
    for (const key of tryKeys) {
      if (!key) continue;
      if (!Object.prototype.hasOwnProperty.call(materialized, key)) continue;
      const val = materialized[key];
      if (val == null) continue;
      if (
        typeof val === 'object' &&
        !(val instanceof Date) &&
        'id' in (val as Record<string, unknown>)
      ) {
        return (val as Record<string, unknown>)['id'];
      }
      if (typeof val === 'string' || typeof val === 'number') return val;
    }
    return undefined as unknown;
  }

  private maybeTestEventFk(
    materialized: Record<string, unknown>,
    relation: { inverseEntityMetadata?: { name?: string } }
  ): unknown {
    if (relation.inverseEntityMetadata?.name !== 'TestEventEntity')
      return undefined as unknown;
    const candidates = ['eventId', 'event_id', 'testEvent'] as const;
    for (const cand of candidates) {
      if (!Object.prototype.hasOwnProperty.call(materialized, cand)) continue;
      const v = materialized[cand];
      if (v == null) continue;
      if (typeof v === 'string' || typeof v === 'number') return v as unknown;
      if (typeof v === 'object' && 'eventId' in (v as Record<string, unknown>))
        return (v as Record<string, unknown>)['eventId'];
    }
    return undefined as unknown;
  }

  private applyResolvedFk(
    materialized: Record<string, unknown>,
    relation: {
      propertyName?: string;
      inverseEntityMetadata?: { name?: string };
    },
    fkVal: unknown,
    projectId: unknown,
    idMaps?: Record<string, Map<unknown, unknown>>
  ) {
    const propName = relation.propertyName;
    // nothing to do if no property to set
    if (!propName) return;
    // If FK already present on object, normalize primitives (number/string) to { id: mappedId }
    if (materialized[propName] != null) {
      const existing = materialized[propName];
      if (typeof existing === 'number' || typeof existing === 'string') {
        const mapped = this.resolveForeignKey(
          existing,
          relation.inverseEntityMetadata?.name,
          idMaps
        );
        const finalId = mapped ?? existing;
        materialized[propName] = { id: finalId } as unknown;
      } else if (
        typeof existing === 'object' &&
        existing != null &&
        !Array.isArray(existing) &&
        !('id' in (existing as Record<string, unknown>)) &&
        // Some export formats might embed raw id under a different key
        (('value' in (existing as Record<string, unknown>) &&
          (typeof (existing as Record<string, unknown>).value === 'number' ||
            typeof (existing as Record<string, unknown>).value ===
              'string')) as boolean)
      ) {
        const val = (existing as Record<string, unknown>).value as
          | number
          | string;
        const mapped = this.resolveForeignKey(
          val,
          relation.inverseEntityMetadata?.name,
          idMaps
        );
        materialized[propName] = { id: mapped ?? val } as unknown;
      }
      return; // Do not proceed to fallback logic if already had a value
    }

    // Resolve when fkVal is present
    if (fkVal != null) {
      const resolved = this.resolveForeignKey(
        fkVal,
        relation.inverseEntityMetadata?.name,
        idMaps
      );
      if (resolved != null) {
        materialized[propName] = { id: resolved } as unknown;
        return;
      }
      // Fall back to using original fkVal
      materialized[propName] = { id: fkVal } as unknown;
      return;
    }

    // Fallback: default project relation
    if (
      relation.inverseEntityMetadata?.name === 'ProjectEntity' &&
      projectId != null
    ) {
      materialized[propName] = { id: projectId } as unknown;
    }
  }

  private resolveForeignKey(
    fkVal: unknown,
    targetEntityName?: string,
    idMaps?: Record<string, Map<unknown, unknown>>
  ): unknown {
    // Try alt key map when fkVal is string-like
    if (typeof fkVal === 'string') {
      const direct = this.lookup(targetEntityName ?? '', fkVal);
      if (direct != null) return direct;
    }
    // Additional attempt: treat fkVal as an export reference if alt key didn't match (string case already handled)
    // Try id map when fkVal is numeric old id
    if (typeof fkVal === 'number') {
      const newId = targetEntityName
        ? idMaps?.[targetEntityName]?.get(fkVal)
        : undefined;
      if (newId != null) return newId;
    }
    return undefined as unknown;
  }
}
