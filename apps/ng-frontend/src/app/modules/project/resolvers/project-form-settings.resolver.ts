import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProjectSetting } from '@utils';
import { SettingsService } from '../../../shared/services/api/settings/settings.service';

export const getProjectFormSettingsResolver: ResolveFn<
  ProjectSetting | null
> = (route, state) => {
  const settingsService = inject(SettingsService);
  if (!route.parent) {
    return null;
  }
  return settingsService.getProjectSettings(route.parent.params['projectSlug']);
};
