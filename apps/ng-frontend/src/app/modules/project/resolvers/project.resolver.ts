import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SettingsService } from '../../../shared/services/api/settings/settings.service';
import { ProjectInfo, ProjectSetting } from '@utils';
import { ProjectInfoService } from '../../../shared/services/api/project-info/project-info.service';

export const projectSettingResolver: ResolveFn<ProjectSetting> = (
  route,
  state
) => {
  const settingsService: SettingsService = inject(SettingsService);
  const projectSlug = route.params['projectSlug'];
  return settingsService.getProjectSettings(projectSlug);
};

export const projectInfoResolver: ResolveFn<ProjectInfo[]> = (route, state) => {
  const projectInfoService = inject(ProjectInfoService);
  return projectInfoService.getProjects();
};
