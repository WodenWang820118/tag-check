import { Destination } from '../../models/destination.model';
import { destinations as rawDestinations } from './destinations';

export interface PublicDestination extends Destination {
  slug: string;
}

export interface PublicDestinationPage {
  items: PublicDestination[];
  hasNext: boolean;
}

interface RawDestination extends Partial<Destination> {
  id: string;
  title: string;
  smallTitle?: string;
  bigImgAuthorInfo?: string;
}

export const PUBLIC_DESTINATION_PAGE_SIZE = 5;

const normalizedDestinations = buildPublicDestinations(
  rawDestinations as RawDestination[]
);

export const publicDestinations: PublicDestination[] = normalizedDestinations;
export const publicDestinationSlugs = publicDestinations.map(
  (destination) => destination.slug
);

export function getPublicDestinationBySlug(
  slug: string
): PublicDestination | null {
  return (
    publicDestinations.find((destination) => destination.slug === slug) ?? null
  );
}

export function getPublicDestinationById(id: string): PublicDestination | null {
  return (
    publicDestinations.find((destination) => destination.id === id) ?? null
  );
}

export function searchPublicDestinations(query: string): PublicDestination[] {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery || normalizedQuery === 'all') {
    return publicDestinations;
  }

  return publicDestinations.filter((destination) =>
    normalizeSearchValue(
      [
        destination.title,
        destination.smallTitle,
        destination.country,
        destination.city,
        destination.description
      ].join(' ')
    ).includes(normalizedQuery)
  );
}

export function getPublicDestinationPage(
  pageIndex: number,
  destinations: PublicDestination[] = publicDestinations,
  pageSize = PUBLIC_DESTINATION_PAGE_SIZE
): PublicDestinationPage {
  const safePageIndex = Math.max(0, pageIndex);
  const offset = safePageIndex * pageSize;
  const items = destinations.slice(offset, offset + pageSize);

  return {
    items,
    hasNext: offset + pageSize < destinations.length
  };
}

function buildPublicDestinations(
  destinations: RawDestination[]
): PublicDestination[] {
  const slugCounts = new Map<string, number>();

  return destinations.map((destination) => {
    const baseSlug = createSlug(destination.title);
    const duplicateCount = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, duplicateCount + 1);

    const slug =
      duplicateCount === 0
        ? baseSlug
        : `${baseSlug}-${destination.id.toLowerCase()}`;

    return {
      id: destination.id,
      slug,
      country: destination.country?.trim() || destination.title,
      city: destination.city?.trim() || destination.title,
      latitude: destination.latitude ?? 0,
      longitude: destination.longitude ?? 0,
      description: destination.description?.trim() || '',
      title: destination.title,
      smallTitle: destination.smallTitle?.trim() || destination.title,
      image1: destination.image1?.trim() || '',
      image1AuthorInfo: destination.image1AuthorInfo?.trim() || '',
      image2: destination.image2?.trim() || '',
      image2AuthorInfo: destination.image2AuthorInfo?.trim() || '',
      image3: destination.image3?.trim() || '',
      image3AuthorInfo: destination.image3AuthorInfo?.trim() || '',
      imageBig: destination.imageBig?.trim() || '',
      imageBigAuthorInfo:
        destination.imageBigAuthorInfo?.trim() ||
        destination.bigImgAuthorInfo?.trim() ||
        '',
      price: destination.price ?? 0,
      video: destination.video?.trim() || ''
    };
  });
}

function createSlug(value: string): string {
  const normalizedValue = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const slug = normalizedValue
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'destination';
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}
