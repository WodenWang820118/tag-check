import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectInfoService } from '../../../shared/services/api/project-info/project-info.service';
import { MetadataSourceService } from '../../../shared/services/metadata-source/metadata-source.service';
import { ProjectInfo } from '@utils';

export const entryMetadataResolver: ResolveFn<ProjectInfo[]> = (
  route,
  state
) => {
  const metadataService = inject(MetadataSourceService);
  const projectInfoService = inject(ProjectInfoService);

  return projectInfoService.getProjects().pipe(
    map((projects) => {
      metadataService.setData(projects);
      return projects;
    }),
    catchError((error) => {
      console.error('Error loading metadata:', error);
      return of([]);
    })
  );
};
