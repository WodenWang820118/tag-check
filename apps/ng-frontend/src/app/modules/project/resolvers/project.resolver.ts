import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SettingsService } from '../../../shared/services/api/settings/settings.service';
import { Project, ProjectSetting } from '@utils';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';

export const projectSettingResolver: ResolveFn<ProjectSetting> = (
  route,
  state
) => {
  const settingsService: SettingsService = inject(SettingsService);
  const projectSlug = route.params['projectSlug'];
  return settingsService.getProjectSettings(projectSlug);
};

export const projectInfoResolver: ResolveFn<Project[]> = (route, state) => {
  const projectService = inject(ProjectService);
  return projectService.getProjects();
};
