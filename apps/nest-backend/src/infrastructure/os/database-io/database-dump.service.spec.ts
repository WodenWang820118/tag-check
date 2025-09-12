import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Writable } from 'stream';
import { DatabaseDumpService } from './database-dump.service';
import { ProjectEntity } from '../../../shared/entity/project.entity';

class StringWritable extends Writable {
  data = '';
  _write(chunk: any, _enc: string, cb: () => void) {
    this.data += chunk?.toString?.() ?? String(chunk);
    cb();
  }
}

describe('DatabaseDumpService (unit)', () => {
  let service: DatabaseDumpService;
  let fakeDataSource: any;

  beforeEach(() => {
    fakeDataSource = {
      options: { type: 'sqlite' },
      entityMetadatas: [],
      getRepository: vi.fn()
    };
    service = new DatabaseDumpService(fakeDataSource as any);
  });

  it('quoteIdentifier should escape double quotes', () => {
    const out = (service as any).quoteIdentifier('a"b');
    expect(out).toBe('"a""b"');
  });

  it('quoteValue should handle many types', () => {
    const q = (service as any).quoteValue.bind(service);

    expect(q(null)).toBe('NULL');
    expect(q(undefined)).toBe('NULL');
    expect(q("O'Hara")).toBe("'O''Hara'");
    const date = new Date('2020-01-01T00:00:00.000Z');
    expect(q(date)).toBe("'2020-01-01T00:00:00.000Z'");
    const buf = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    expect(q(buf)).toBe("X'deadbeef'");
    const objQuoted = q({ a: 1 });
    // should be a single-quoted JSON string containing the key and value
    expect(typeof objQuoted).toBe('string');
    expect(objQuoted).toMatch(/^'.*"a":1.*'$/);
    expect(q(true)).toBe('1');
    expect(q(false)).toBe('0');
    expect(q(123)).toBe('123');
  });

  it('writeInsertStatements writes INSERTs and comment', async () => {
    const writer = new StringWritable();
    const entity: any = {
      name: 'User',
      tableName: 'user',
      columns: [
        { propertyName: 'id', databaseName: 'id' },
        { propertyName: 'name', databaseName: 'name' }
      ]
    };
    const records = [{ id: 1, name: "O'Hara" }];

    await (service as any).writeInsertStatements(writer, entity, records);

    // stream writes are synchronous in our StringWritable _write implementation
    expect(writer.data).toContain('-- Data for entity: User (table: user)');
    expect(writer.data).toContain('INSERT INTO "user" ("id", "name")');
    expect(writer.data).toContain('VALUES (1,');
    expect(writer.data).toContain("'O''Hara'");
  });

  it('dumpEntityData should call writeInsertStatements for entities with projectId column', async () => {
    const writer = new StringWritable();
    const entity: any = {
      name: 'SomeEntity',
      tableName: 'some_entity',
      columns: [{ propertyName: 'projectId' }]
    };

    // repository that returns records filtered by projectId
    const repo = {
      find: vi.fn(async (opts: any) => [{ projectId: 42, foo: 'bar' }])
    };
    fakeDataSource.getRepository.mockReturnValue(repo);

    const spy = vi
      .spyOn(service as any, 'writeInsertStatements')
      .mockResolvedValue(undefined);

    await (service as any).dumpEntityData(writer, entity as any, 42);

    expect(repo.find).toHaveBeenCalledWith({ where: { projectId: 42 } });
    expect(spy).toHaveBeenCalled();
  });

  it('dumpProjectDatabase throws when project not found', async () => {
    // make getRepository(ProjectEntity).findOne return undefined/null
    const repoProject = { findOne: vi.fn(async () => null) };
    fakeDataSource.getRepository.mockImplementation((arg: any) => {
      if (arg === ProjectEntity) return repoProject;
      return { find: async () => [] };
    });

    // call and expect rejection
    await expect(
      service.dumpProjectDatabase('nonexistent-slug', 'test-dumps/out.sql')
    ).rejects.toThrow(/Project with projectSlug/);
  });
});
