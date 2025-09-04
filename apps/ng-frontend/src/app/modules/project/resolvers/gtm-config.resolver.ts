import { ResolveFn } from '@angular/router';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';
import { GTMConfiguration } from '@utils';
import { inject } from '@angular/core';

export const gtmConfigResolver: ResolveFn<GTMConfiguration | null> = (
  route
) => {
  const projectService = inject(ProjectService);

  if (!route.parent) {
    return null;
  }

  return projectService.getProjectGtmConfig(route.parent.params['projectSlug']);
};
