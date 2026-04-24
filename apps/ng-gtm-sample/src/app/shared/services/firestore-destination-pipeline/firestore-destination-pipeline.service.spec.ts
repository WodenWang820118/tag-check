import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_FIRESTORE } from '../../../firebase/firebase.tokens';
import { Destination } from '../../models/destination.model';
import { FirebaseStorageService } from '../firebase-storage/firebase-storage.service';
import { IndexeddbDestinationService } from '../indexeddb-destination/indexeddb-destination.service';
import { FirestoreDestinationPipelineService } from './firestore-destination-pipeline.service';

const firestoreQueryState = vi.hoisted(() => ({
  getDocs: vi.fn(),
  collection: vi.fn((_firestore: unknown, name: string) => ({ name })),
  endBefore: vi.fn((value: unknown) => ({ type: 'endBefore', value })),
  query: vi.fn((_collectionRef: unknown, ...constraints: unknown[]) => ({
    constraints
  })),
  orderBy: vi.fn((field: string) => ({ type: 'orderBy', field })),
  limit: vi.fn((value: number) => ({ type: 'limit', value })),
  limitToLast: vi.fn((value: number) => ({ type: 'limitToLast', value })),
  startAfter: vi.fn((value: unknown) => ({ type: 'startAfter', value })),
  where: vi.fn((field: string, operator: string, value: unknown) => ({
    type: 'where',
    field,
    operator,
    value
  }))
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreQueryState.collection,
  endBefore: firestoreQueryState.endBefore,
  getDocs: firestoreQueryState.getDocs,
  query: firestoreQueryState.query,
  orderBy: firestoreQueryState.orderBy,
  limit: firestoreQueryState.limit,
  limitToLast: firestoreQueryState.limitToLast,
  startAfter: firestoreQueryState.startAfter,
  where: firestoreQueryState.where
}));

import {
  endBefore,
  getDocs,
  limitToLast,
  startAfter,
  where
} from 'firebase/firestore';

function createDestination(overrides: Partial<Destination> = {}): Destination {
  return {
    id: 'destination-1',
    country: 'Japan',
    city: 'Tokyo',
    latitude: 35.68,
    longitude: 139.76,
    description: 'A city break destination.',
    title: 'Tokyo Lights',
    smallTitle: 'Japan',
    image1: 'image-1.jpg',
    image1AuthorInfo: 'Image 1 credit',
    image2: 'image-2.jpg',
    image2AuthorInfo: 'Image 2 credit',
    image3: 'image-3.jpg',
    image3AuthorInfo: 'Image 3 credit',
    imageBig: 'image-big.jpg',
    imageBigAuthorInfo: 'Hero credit',
    price: 1299,
    video: 'https://youtu.be/demo',
    ...overrides
  };
}

function createSnapshot(destinations: Destination[]) {
  return {
    docs: destinations.map((destination) => ({
      id: destination.id,
      data: () => ({ ...destination })
    }))
  } as any;
}

describe('FirestoreDestinationPipelineService', () => {
  const firebaseStorageService = {
    getImage: vi.fn((name: string) => of(`resolved:${name}`))
  };
  const indexeddbDestinationService = {
    getAllDestinations: vi.fn(),
    replaceDestinations: vi.fn()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    firebaseStorageService.getImage.mockReset();
    firebaseStorageService.getImage.mockImplementation((name: string) =>
      of(`resolved:${name}`)
    );
    indexeddbDestinationService.getAllDestinations.mockReset();
    indexeddbDestinationService.replaceDestinations.mockReset();
    firestoreQueryState.getDocs.mockReset();
    firestoreQueryState.collection.mockClear();
    firestoreQueryState.query.mockClear();
    firestoreQueryState.orderBy.mockClear();
    firestoreQueryState.limit.mockClear();
    firestoreQueryState.limitToLast.mockClear();
    firestoreQueryState.startAfter.mockClear();
    firestoreQueryState.endBefore.mockClear();
    firestoreQueryState.where.mockClear();

    TestBed.configureTestingModule({
      providers: [
        FirestoreDestinationPipelineService,
        {
          provide: FIREBASE_FIRESTORE,
          useValue: { projectId: 'sample-project' }
        },
        {
          provide: FirebaseStorageService,
          useValue: firebaseStorageService
        },
        {
          provide: IndexeddbDestinationService,
          useValue: indexeddbDestinationService
        }
      ]
    });
  });

  it('returns cached destinations without hitting Firestore when the cache is populated', async () => {
    const cachedDestination = createDestination({
      id: 'cached-destination',
      image1: 'https://cdn.example.com/cached-image-1.jpg'
    });
    indexeddbDestinationService.getAllDestinations.mockReturnValue(
      of([cachedDestination])
    );

    const service = TestBed.inject(FirestoreDestinationPipelineService);
    const result = await firstValueFrom(service.getAllDestinationsData());

    expect(result).toEqual([cachedDestination]);
    expect(getDocs).not.toHaveBeenCalled();
    expect(indexeddbDestinationService.replaceDestinations).not.toHaveBeenCalled();
  });

  it('fetches all destinations from Firestore and refreshes the cache when the cache is empty', async () => {
    const firestoreDestination = createDestination();
    indexeddbDestinationService.getAllDestinations.mockReturnValue(of([]));
    indexeddbDestinationService.replaceDestinations.mockReturnValue(
      of([firestoreDestination.id])
    );
    firestoreQueryState.getDocs.mockResolvedValue(
      createSnapshot([firestoreDestination])
    );

    const service = TestBed.inject(FirestoreDestinationPipelineService);
    const result = await firstValueFrom(service.getAllDestinationsData());

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(firebaseStorageService.getImage).toHaveBeenCalledWith('image-1.jpg');
    expect(indexeddbDestinationService.replaceDestinations).toHaveBeenCalledWith(
      result
    );
    expect(result[0].image1).toBe('resolved:image-1.jpg');
    expect(result[0].image2).toBe('resolved:image-2.jpg');
    expect(result[0].image3).toBe('resolved:image-3.jpg');
    expect(result[0].imageBig).toBe('resolved:image-big.jpg');
  });

  it('returns an empty list and refreshes the cache when Firestore has no destinations yet', async () => {
    indexeddbDestinationService.getAllDestinations.mockReturnValue(of([]));
    indexeddbDestinationService.replaceDestinations.mockReturnValue(of([]));
    firestoreQueryState.getDocs.mockResolvedValue(createSnapshot([]));

    const service = TestBed.inject(FirestoreDestinationPipelineService);
    const result = await firstValueFrom(service.getAllDestinationsData());

    expect(result).toEqual([]);
    expect(indexeddbDestinationService.replaceDestinations).toHaveBeenCalledWith([]);
    expect(firebaseStorageService.getImage).not.toHaveBeenCalled();
  });

  it('returns an empty list when refreshing the cache fails', async () => {
    indexeddbDestinationService.getAllDestinations.mockReturnValue(of([]));
    const service = TestBed.inject(FirestoreDestinationPipelineService);
    vi.spyOn(service, 'refreshAllDestinationsCache').mockReturnValue(
      throwError(() => new Error('firestore offline'))
    );

    const result = await firstValueFrom(service.getAllDestinationsData());

    expect(result).toEqual([]);
  });

  it('returns an empty list when image resolution fails during getAllDestinationsData', async () => {
    const firestoreDestination = createDestination();
    indexeddbDestinationService.getAllDestinations.mockReturnValue(of([]));
    firestoreQueryState.getDocs.mockResolvedValue(
      createSnapshot([firestoreDestination])
    );
    firebaseStorageService.getImage.mockReturnValueOnce(
      throwError(() => new Error('image lookup failed'))
    );

    const service = TestBed.inject(FirestoreDestinationPipelineService);
    const result = await firstValueFrom(service.getAllDestinationsData());

    expect(result).toEqual([]);
  });

  it('returns empty lists when next or previous pagination is requested without a cursor', async () => {
    const service = TestBed.inject(FirestoreDestinationPipelineService);

    const nextResult = await firstValueFrom(service.getNextDestinationsData(2));
    const previousResult = await firstValueFrom(service.getPreviousDestinationsData());

    expect(nextResult).toEqual([]);
    expect(previousResult).toEqual([]);
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('propagates image resolution failures for paginated fetches', async () => {
    firestoreQueryState.getDocs.mockResolvedValue(
      createSnapshot([createDestination()])
    );
    firebaseStorageService.getImage.mockReturnValueOnce(
      throwError(() => new Error('image lookup failed'))
    );

    const service = TestBed.inject(FirestoreDestinationPipelineService);

    await expect(
      firstValueFrom(service.getFirstDestinationsData(2))
    ).rejects.toThrow('image lookup failed');
  });

  it('supports first, next, previous, and search pagination flows', async () => {
    const firstPage = [
      createDestination({ id: 'destination-1', country: 'Argentina' }),
      createDestination({ id: 'destination-2', country: 'Brazil' })
    ];
    const nextPage = [
      createDestination({ id: 'destination-3', country: 'Canada' }),
      createDestination({ id: 'destination-4', country: 'Denmark' })
    ];
    const previousPage = [
      createDestination({ id: 'destination-1', country: 'Argentina' }),
      createDestination({ id: 'destination-2', country: 'Brazil' })
    ];
    const searchResults = [
      createDestination({ id: 'destination-5', country: 'Japan' }),
      createDestination({ id: 'destination-6', country: 'Jordan' })
    ];
    firestoreQueryState.getDocs
      .mockResolvedValueOnce(createSnapshot(firstPage))
      .mockResolvedValueOnce(createSnapshot(nextPage))
      .mockResolvedValueOnce(createSnapshot(previousPage))
      .mockResolvedValueOnce(createSnapshot(searchResults));

    const service = TestBed.inject(FirestoreDestinationPipelineService);
    const firstResult = await firstValueFrom(service.getFirstDestinationsData(2));
    const nextResult = await firstValueFrom(service.getNextDestinationsData(2));
    const previousResult = await firstValueFrom(service.getPreviousDestinationsData());
    const searchResult = await firstValueFrom(
      service.getSearchResultsData('Ja', 2)
    );

    expect(firstResult.map((destination) => destination.id)).toEqual([
      'destination-1',
      'destination-2'
    ]);
    expect(nextResult.map((destination) => destination.id)).toEqual([
      'destination-3',
      'destination-4'
    ]);
    expect(previousResult.map((destination) => destination.id)).toEqual([
      'destination-1',
      'destination-2'
    ]);
    expect(searchResult.map((destination) => destination.id)).toEqual([
      'destination-5',
      'destination-6'
    ]);
    expect(service.getPreviousDocsStackLength()).toBe(1);
    expect(service.lastVisibleDocs$()?.id).toBe('destination-6');
    expect(startAfter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'destination-2' })
    );
    expect(endBefore).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'destination-3' })
    );
    expect(limitToLast).toHaveBeenCalledWith(2);
    expect(where).toHaveBeenCalledWith('country', '>=', 'Ja');
    expect(where).toHaveBeenCalledWith('country', '<=', 'Ja\uf8ff');
  });

  it('keeps search filters when paginating to the next search result page', async () => {
    const searchPage = [
      createDestination({ id: 'destination-5', country: 'Japan' }),
      createDestination({ id: 'destination-6', country: 'Jordan' })
    ];
    const nextSearchPage = [
      createDestination({ id: 'destination-7', country: 'Jamaica' }),
      createDestination({ id: 'destination-8', country: 'Japan' })
    ];
    firestoreQueryState.getDocs
      .mockResolvedValueOnce(createSnapshot(searchPage))
      .mockResolvedValueOnce(createSnapshot(nextSearchPage));

    const service = TestBed.inject(FirestoreDestinationPipelineService);
    const firstSearchResult = await firstValueFrom(
      service.getSearchResultsData('Ja', 2)
    );
    const nextSearchResult = await firstValueFrom(service.getNextDestinationsData(2));

    expect(firstSearchResult.map((destination) => destination.id)).toEqual([
      'destination-5',
      'destination-6'
    ]);
    expect(nextSearchResult.map((destination) => destination.id)).toEqual([
      'destination-7',
      'destination-8'
    ]);
    expect(startAfter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'destination-6' })
    );
    expect(where).toHaveBeenCalledWith('country', '>=', 'Ja');
    expect(where).toHaveBeenCalledWith('country', '<=', 'Ja\uf8ff');
  });
});
