import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import {
  getPublicDestinationById,
  getPublicDestinationBySlug
} from '../services/destination/destination-catalog';

export const destinationSlugGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const slugOrId = route.paramMap.get('slug');

  if (slugOrId && getPublicDestinationBySlug(slugOrId)) {
    return true;
  }

  const destination = slugOrId ? getPublicDestinationById(slugOrId) : null;

  if (destination) {
    return router.createUrlTree(['/product/details', destination.slug], {
      queryParams: route.queryParams,
      fragment: route.fragment ?? undefined
    });
  }

  return router.createUrlTree(['/404']);
};
