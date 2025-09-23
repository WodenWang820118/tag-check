import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Writable } from 'stream';
import { DatabaseSerializationService } from './database-serialization.service';
import { DatabaseDataDumpService } from './database-data-dump.service';
import { DatabaseDumpOrchestratorService } from './database-dump-orchestrator.service';
import { ProjectEntity } from '../../../shared/entity/project.entity';

class StringWritable extends Writable {
  data = '';
  _write(chunk: Buffer, _enc: BufferEncoding, cb: () => void) {
    this.data += chunk?.toString?.() ?? String(chunk);
    cb();
  }
}

describe('Database dump refactor (unit)', () => {
  let serializer: DatabaseSerializationService;
  let dataDump: DatabaseDataDumpService;
  let orchestrator: DatabaseDumpOrchestratorService;
  let fakeDataSource: {
    options: { type: string };
    entityMetadatas: any[];
    getRepository: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    fakeDataSource = {
      options: { type: 'sqlite' },
      entityMetadatas: [],
      getRepository: vi.fn()
    };
    serializer = new DatabaseSerializationService();
    dataDump = new DatabaseDataDumpService(
      fakeDataSource as unknown as any,
      serializer
    );
    orchestrator = new DatabaseDumpOrchestratorService(
      fakeDataSource as unknown as any,
      new (class {
        async dumpSchema(ws: NodeJS.WritableStream) {
          ws.write('-- schema --\n');
        }
      })() as any,
      dataDump
    );
  });

  it('quoteIdentifier should escape double quotes', () => {
    const out = serializer.quoteIdentifier('a"b');
    expect(out).toBe('"a""b"');
  });

  it('quoteValue should handle many types', () => {
    const q = serializer.quoteValue.bind(serializer);

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
    const entity = {
      name: 'User',
      tableName: 'user',
      columns: [
        { propertyName: 'id', databaseName: 'id' },
        { propertyName: 'name', databaseName: 'name' }
      ]
    } as unknown as {
      name: string;
      tableName: string;
      columns: Array<{ propertyName: string; databaseName: string }>;
    };
    const records = [{ id: 1, name: "O'Hara" }];

    await (dataDump as unknown as any).writeInsertStatements(
      writer,
      entity,
      records
    );

    // stream writes are synchronous in our StringWritable _write implementation
    expect(writer.data).toContain('-- Data for entity: User (table: user)');
    expect(writer.data).toContain('INSERT INTO "user" ("id", "name")');
    expect(writer.data).toContain('VALUES (1,');
    expect(writer.data).toContain("'O''Hara'");
  });

  it('dumpEntityData should call writeInsertStatements for entities with projectId column', async () => {
    const writer = new StringWritable();
    const entity = {
      name: 'SomeEntity',
      tableName: 'some_entity',
      columns: [{ propertyName: 'projectId' }]
    } as unknown as {
      name: string;
      tableName: string;
      columns: Array<{ propertyName: string }>;
    };

    // repository that returns records filtered by projectId
    const repo = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      find: vi.fn(async (_opts: unknown) => [{ projectId: 42, foo: 'bar' }])
    };
    fakeDataSource.getRepository.mockReturnValue(repo);

    const spy = vi
      .spyOn(dataDump as unknown as any, 'writeInsertStatements')
      .mockResolvedValue(undefined);

    await (dataDump as unknown as any).dumpEntityData(
      writer,
      entity as unknown as any,
      42
    );

    expect(repo.find).toHaveBeenCalledWith({ where: { projectId: 42 } });
    expect(spy).toHaveBeenCalled();
  });

  it('dumpProjectDatabase throws when project not found', async () => {
    // make getRepository(ProjectEntity).findOne return undefined/null
    const repoProject = { findOne: vi.fn(async () => null) };
    fakeDataSource.getRepository.mockImplementation((arg: unknown) => {
      if (arg === ProjectEntity) return repoProject;
      return { find: async () => [] };
    });

    // call and expect rejection
    await expect(
      orchestrator.dumpProjectDatabase('nonexistent-slug', 'test-dumps/out.sql')
    ).rejects.toThrow(/Project with projectSlug/);
  });
});
