import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner, EntityMetadata } from 'typeorm';

@Injectable()
export class PointerRepairService {
  private readonly logger = new Logger(PointerRepairService.name);

  async repairPointers(
    queryRunner: QueryRunner,
    metasByName: Map<string, EntityMetadata>,
    insertionOrder: string[],
    idMaps: Record<string, Map<unknown, unknown>>
  ) {
    for (const name of insertionOrder) {
      const meta = metasByName.get(name);
      if (!meta) continue;
      const repo = queryRunner.manager.getRepository(meta.name);

      const pointerInfo = this.buildPointerInfo(meta);
      const pointerCols = Object.keys(pointerInfo);
      if (!pointerCols.length) continue;

      const allRows = await this.fetchAllRows(repo);
      if (!allRows.length) continue;

      const updates: Record<string, unknown>[] = [];
      for (const row of allRows) {
        if (this.repairRowPointers(row, pointerCols, pointerInfo, idMaps)) {
          updates.push(row);
        }
      }

      if (updates.length) {
        await this.saveUpdatesSafely(repo, updates, name);
      }
    }
  }

  private buildPointerInfo(
    meta: EntityMetadata
  ): Record<string, { target?: string; prop?: string }> {
    const pointerToInfo: Record<string, { target?: string; prop?: string }> =
      {};
    for (const rel of meta.relations) {
      if (!(rel.isManyToOne || rel.isOneToOneOwner)) continue;
      const jc = rel.joinColumns?.[0] as
        | { databaseName?: string; name?: string }
        | undefined;
      const dbName = jc?.databaseName ?? jc?.name ?? undefined;
      const propName = rel.propertyName;
      const target = rel.inverseEntityMetadata?.name;
      if (dbName) pointerToInfo[dbName] = { target, prop: propName };
      if (propName) pointerToInfo[propName] = { target, prop: propName };
      // also support snake_case column names
      if (dbName?.endsWith('_id')) {
        const base = dbName.slice(0, -3);
        pointerToInfo[`${base}_id`] = { target, prop: propName };
      }
    }
    return pointerToInfo;
  }

  private async fetchAllRows(
    repo: ReturnType<QueryRunner['manager']['getRepository']>
  ): Promise<Record<string, unknown>[]> {
    try {
      return (await repo.find()) as Record<string, unknown>[];
    } catch {
      return [];
    }
  }

  private repairRowPointers(
    row: Record<string, unknown>,
    pointerCols: string[],
    pointerInfo: Record<string, { target?: string; prop?: string }>,
    idMaps: Record<string, Map<unknown, unknown>>
  ): boolean {
    let changed = false;
    for (const colKey of pointerCols) {
      const info = pointerInfo[colKey];
      const targetEntity = info?.target;
      if (!targetEntity) continue;
      const rawVal = row[colKey];
      if (rawVal == null) continue;
      const map = idMaps[targetEntity];
      if (!map) continue;
      if (map.has(rawVal)) {
        const newVal = map.get(rawVal);
        if (newVal !== rawVal) {
          const propName = info.prop ?? colKey.replace(/_id$/, '');
          row[propName] = { id: newVal } as unknown;
          changed = true;
        }
      }
    }
    return changed;
  }

  private async saveUpdatesSafely(
    repo: ReturnType<QueryRunner['manager']['getRepository']>,
    updates: Record<string, unknown>[],
    name: string
  ): Promise<void> {
    try {
      await repo.save(updates);
    } catch (e) {
      this.logger.debug(
        `Failed bulk pointer repair for ${name}: ${(e as Error).message}`
      );
    }
  }
}
