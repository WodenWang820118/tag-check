import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';
import { MetadataSourceService } from '../../../shared/services/data-source/metadata-source.service';
import { Project } from '@utils';

export const entryMetadataResolver: ResolveFn<Project[]> = () => {
  const metadataService = inject(MetadataSourceService);
  const projectInfoService = inject(ProjectService);

  return projectInfoService.getProjects().pipe(
    map((projects) => {
      console.debug('projects: ', projects);
      metadataService.setData(projects);
      return projects;
    }),
    catchError((error) => {
      console.error('Error loading metadata:', error);
      return of([]);
    })
  );
};
