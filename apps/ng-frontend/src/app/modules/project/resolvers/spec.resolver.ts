import { Spec } from '@utils';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';

export const specResolver: ResolveFn<Spec> = (route, state) => {
  const specService = inject(SpecService);
  const projectSlug = route.parent?.params['projectSlug'];
  const eventId = route.params['eventId'];
  return specService.getEventSpec(projectSlug, eventId);
};

export const reportDetailSlugResolver: ResolveFn<string> = (route, state) => {
  return route.parent?.params['projectSlug'];
};

export const reportDetailEventIdResolver: ResolveFn<string> = (
  route,
  state
) => {
  return route.params['eventId'];
};
