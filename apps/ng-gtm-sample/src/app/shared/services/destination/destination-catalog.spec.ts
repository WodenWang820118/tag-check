import { describe, expect, it } from 'vitest';
import {
  getPublicDestinationById,
  getPublicDestinationBySlug,
  getPublicDestinationPage,
  publicDestinations,
  publicDestinationSlugs,
  PUBLIC_DESTINATION_PAGE_SIZE,
  searchPublicDestinations
} from './destination-catalog';

describe('destination-catalog', () => {
  it('normalizes the raw destination data into stable slugged public records', () => {
    const switzerland = getPublicDestinationById('city001');

    expect(switzerland).toEqual(
      expect.objectContaining({
        id: 'city001',
        slug: 'switzerland',
        title: 'Switzerland',
        country: 'Switzerland',
        city: 'Switzerland'
      })
    );
    expect(publicDestinations.length).toBeGreaterThan(0);
    expect(new Set(publicDestinationSlugs).size).toBe(
      publicDestinationSlugs.length
    );
  });

  it('looks destinations up by slug for direct-entry detail pages', () => {
    const switzerland = getPublicDestinationBySlug('switzerland');

    expect(switzerland?.id).toBe('city001');
  });

  it('searches across public destination metadata for catalog pages', () => {
    const allResults = searchPublicDestinations('all');
    const islandResults = searchPublicDestinations('island');
    const swissResults = searchPublicDestinations('switzerland');

    expect(allResults).toHaveLength(publicDestinations.length);
    expect(islandResults.length).toBeGreaterThan(0);
    expect(
      islandResults.every((destination) => destination.slug.length > 0)
    ).toBe(true);
    expect(swissResults.map((destination) => destination.slug)).toContain(
      'switzerland'
    );
  });

  it('returns paged slices for the public catalog grid', () => {
    const firstPage = getPublicDestinationPage(0);
    const secondPage = getPublicDestinationPage(1);

    expect(firstPage.items).toHaveLength(PUBLIC_DESTINATION_PAGE_SIZE);
    expect(firstPage.hasNext).toBe(true);
    expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);
    expect(secondPage.hasNext).toBe(false);
  });
});
