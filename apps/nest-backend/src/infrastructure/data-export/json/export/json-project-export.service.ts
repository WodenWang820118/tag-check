import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityMetadata } from 'typeorm';
import { ProjectExportProvider } from '../../interfaces/project-export-provider.interface';

type FixtureRow = Record<string, unknown>;

interface FixtureEnvelopeV1 {
  version: 1;
  exportedAt: string; // ISO
  schemaHash: string; // placeholder until migrations introduced
  projectSlug: string;
  entities: Record<string, FixtureRow[]>; // EntityName -> rows
}

@Injectable()
export class JsonProjectExportService implements ProjectExportProvider {
  private readonly logger = new Logger(JsonProjectExportService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async exportProject(projectSlug: string): Promise<FixtureEnvelopeV1> {
    this.logger.log(`Exporting project (JSON) slug=${projectSlug}`);

    const projectMeta = this.getProjectEntityMeta();
    const projectRepo = this.dataSource.getRepository(projectMeta.name);
    const project = await projectRepo.findOne({ where: { projectSlug } });
    if (!project) {
      throw new Error(`Project with slug '${projectSlug}' not found`);
    }
    const projectId = (project as unknown as { id: number | string }).id;
    const canonicalProjectSlug = (project as unknown as { projectSlug: string })
      .projectSlug;

    // Build ordered list of entity metas. For initial pass we reuse existing heuristics.
    const metas = [...this.dataSource.entityMetadatas];
    metas.sort((a, b) => {
      if (a === projectMeta && b !== projectMeta) return -1;
      if (b === projectMeta && a !== projectMeta) return 1;
      const aDependsOnB = a.relations?.some(
        (r) => r.inverseEntityMetadata === b
      );
      const bDependsOnA = b.relations?.some(
        (r) => r.inverseEntityMetadata === a
      );
      if (aDependsOnB && !bDependsOnA) return 1;
      if (bDependsOnA && !aDependsOnB) return -1;
      return a.name.localeCompare(b.name);
    });

    const result: Record<string, FixtureRow[]> = {};
    for (const meta of metas) {
      try {
        const rows = await this.fetchRowsForProject(meta, projectId);
        if (rows && rows.length > 0) {
          result[meta.name] = rows.map((r) =>
            this.serializeRow(r, meta, canonicalProjectSlug)
          );
        }
      } catch (e) {
        this.logger.debug(
          `Skipping entity ${meta.name}: ${(e as Error).message}`
        );
      }
    }

    const envelope: FixtureEnvelopeV1 = {
      version: 1,
      exportedAt: new Date().toISOString(),
      schemaHash: 'dev-schema-hash',
      projectSlug,
      entities: result
    };
    return envelope;
  }

  private getProjectEntityMeta(): EntityMetadata {
    const meta = this.dataSource.entityMetadatas.find(
      (m) => m.name === 'ProjectEntity'
    );
    if (!meta) throw new Error('ProjectEntity metadata not found');
    return meta;
  }

  private async fetchRowsForProject(
    meta: EntityMetadata,
    projectId: number | string
  ): Promise<FixtureRow[] | undefined> {
    const repo = this.dataSource.getRepository(meta.name);

    // Direct project table
    if (meta.name === 'ProjectEntity' || meta.tableName === 'project') {
      // loadRelationIds will include relation id values for any relations defined on the entity
      return repo.find({ where: { id: projectId }, loadRelationIds: true });
    }
    // Direct FK column conventions
    if (meta.columns.some((c) => c.propertyName === 'projectId')) {
      return repo.find({ where: { projectId }, loadRelationIds: true });
    }
    if (meta.columns.some((c) => c.propertyName === 'project')) {
      return repo.find({
        where: { project: { id: projectId } },
        loadRelationIds: true
      });
    }
    // Indirect via relation whose parent has project_id
    for (const relation of meta.relations) {
      const parent = relation.inverseEntityMetadata;
      if (!parent) continue;
      const parentHasProject = parent.columns.some(
        (c) => c.databaseName === 'project_id'
      );
      if (!parentHasProject) continue;
      try {
        // Use QueryBuilder to join to the parent and filter by its project_id.
        // Use loadAllRelationIds to ensure relation id fields are returned.
        const qb = repo.createQueryBuilder('e');
        qb.innerJoin(`e.${relation.propertyName}`, 'p');
        qb.where('p.project_id = :projectId', { projectId });
        // load all relation ids so relation references become explicit id values
        qb.loadAllRelationIds();
        const res = await qb.getMany();
        if (res.length) return res;
      } catch {
        /* ignore */
      }
    }
    return undefined;
  }

  private serializeRow(
    row: FixtureRow,
    meta: EntityMetadata,
    projectSlug: string
  ): FixtureRow {
    const out: FixtureRow = {};
    for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
      if (v instanceof Date) out[k] = v.toISOString();
      else if (Buffer.isBuffer(v))
        out[k] = { __type: 'Buffer', data: v.toString('base64') };
      else out[k] = v;
    }
    // Inject projectSlug for any non-project entity that is project-scoped.
    if (meta.name !== 'ProjectEntity') {
      // If row already has projectId or an inferred relation to project, include slug.
      if ('projectId' in out || 'project' in out) {
        out['projectSlug'] = projectSlug;
      }
    }
    return out;
  }
}
