import { vi } from 'vitest';
import type {
  DeepPartial,
  EntityMetadata,
  FindOneOptions,
  ObjectLiteral,
  Repository
} from 'typeorm';

/**
 * The repository calls the import services make, with the one signature of
 * each overloaded method that they use.
 */
export interface ImportRepository {
  findOne(
    options: FindOneOptions<ObjectLiteral>
  ): Promise<ObjectLiteral | null>;
  create(entityLike: DeepPartial<ObjectLiteral>): ObjectLiteral;
  save(entity: DeepPartial<ObjectLiteral>): Promise<ObjectLiteral>;
}

/** Typed mocks of the repository methods the import services call. */
export function importRepositoryMock() {
  return {
    findOne: vi.fn<ImportRepository['findOne']>(),
    create: vi.fn<ImportRepository['create']>(),
    save: vi.fn<ImportRepository['save']>()
  };
}

/**
 * The import services call only `findOne`, `create` and `save`, so a mock of
 * those stands in for the whole repository.
 */
export function asRepository(
  repo: ImportRepository
): Repository<ObjectLiteral> {
  return repo as Repository<ObjectLiteral>;
}

/** Metadata for a service that reads only the entity name. */
export function entityMeta(name: string): EntityMetadata {
  return { name } as EntityMetadata;
}
