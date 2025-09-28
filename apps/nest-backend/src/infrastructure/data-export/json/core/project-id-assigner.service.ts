import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';

@Injectable()
export class ProjectIdAssignerService {
  private readonly logger = new Logger(ProjectIdAssignerService.name);

  assignIfApplicable(params: {
    materialized: Record<string, unknown>;
    meta: EntityMetadata;
    newProjectId: unknown;
  }) {
    const { materialized, meta, newProjectId } = params;

    if (meta.name !== 'ProjectEntity' && newProjectId != null) {
      if ('projectId' in materialized) {
        materialized['projectId'] = newProjectId;
      }
    } else if (meta.name !== 'ProjectEntity' && newProjectId == null) {
      this.logger.debug(
        `Import order warning: importing ${meta.name} before new ProjectEntity primary key established.`
      );
    }
  }
}
