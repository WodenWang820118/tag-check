import { JsonProjectExportService } from './json-project-export.service';
import { DataSource, EntityMetadata } from 'typeorm';

function meta(name: string): EntityMetadata {
  return {
    name,
    tableName: name.toLowerCase(),
    columns: [],
    relations: []
  } as unknown as EntityMetadata;
}

describe('JsonProjectExportService (unit)', () => {
  let service: JsonProjectExportService;
  let repoData: Record<string, unknown[]>;
  beforeEach(() => {
    repoData = {
      ProjectEntity: [
        {
          id: 1,
          projectSlug: 'slug',
          createdAt: new Date('2024-01-01T00:00:00.000Z')
        }
      ],
      ChildEntity: [
        { id: 11, project: { id: 1 }, bufferField: Buffer.from('abc') }
      ]
    };
    const metas: EntityMetadata[] = [
      meta('ChildEntity'),
      meta('ProjectEntity')
    ];
    const makeRepo = (name: string) => {
      const findOne = async (q: { where: { projectSlug: string } }) => {
        for (const r of repoData.ProjectEntity) {
          if (
            (r as Record<string, unknown>).projectSlug === q.where.projectSlug
          )
            return r;
        }
        return undefined;
      };
      const find = async () => repoData[name] || [];
      return { findOne, find };
    };
    const ds: unknown = {
      entityMetadatas: metas,
      getRepository: (name: string) => makeRepo(name)
    };
    service = new JsonProjectExportService(ds as DataSource);
  });

  it('exports envelope with serialized project date', async () => {
    const env = await service.exportProject('slug');
    expect(env.version).toBe(1);
    expect(env.projectSlug).toBe('slug');
    expect(env.entities.ProjectEntity[0].createdAt).toBe(
      '2024-01-01T00:00:00.000Z'
    );
  });

  it('throws when project not found', async () => {
    await expect(service.exportProject('missing')).rejects.toThrow(/not found/);
  });
});
