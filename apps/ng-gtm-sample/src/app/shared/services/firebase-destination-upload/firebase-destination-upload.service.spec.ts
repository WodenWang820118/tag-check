import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FIREBASE_FIRESTORE } from '../../../firebase/firebase.tokens';
import { CreateDestinationDraft } from '../../models/create-destination-draft.model';
import { FirebaseStorageService } from '../firebase-storage/firebase-storage.service';
import { FirestoreDestinationPipelineService } from '../firestore-destination-pipeline/firestore-destination-pipeline.service';
import { FirebaseDestinationUploadService } from './firebase-destination-upload.service';

const firestoreMockState = vi.hoisted(() => ({
  collectionRef: { path: 'destinations' },
  docRef: { id: 'destination-123' },
  setDoc: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => firestoreMockState.collectionRef),
  doc: vi.fn(() => firestoreMockState.docRef),
  setDoc: firestoreMockState.setDoc
}));

import { setDoc } from 'firebase/firestore';

function createDraft(): CreateDestinationDraft {
  return {
    country: 'Japan',
    city: 'Tokyo',
    title: 'Tokyo Lights',
    smallTitle: 'Japan',
    latitude: 35.68,
    longitude: 139.76,
    description: 'A city break destination.',
    price: 1299,
    video: 'https://youtu.be/demo',
    imageBigAuthorInfo: 'Hero credit',
    image1AuthorInfo: 'Image 1 credit',
    image2AuthorInfo: 'Image 2 credit',
    image3AuthorInfo: 'Image 3 credit',
    files: {
      imageBig: new File(['hero'], 'hero.jpg', { type: 'image/jpeg' }),
      image1: new File(['one'], 'one.png', { type: 'image/png' }),
      image2: new File(['two'], 'two.webp', { type: 'image/webp' }),
      image3: new File(['three'], 'three.jpg', { type: 'image/jpeg' })
    }
  };
}

describe('FirebaseDestinationUploadService', () => {
  const firebaseStorageService = {
    uploadImage: vi.fn((_: File, fileName: string) =>
      of({
        fileName,
        downloadUrl: `https://cdn.example.com/${fileName}`
      })
    )
  };
  const pipelineService = {
    refreshAllDestinationsCache: vi.fn(() => of([]))
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    firestoreMockState.setDoc.mockReset();
    firestoreMockState.setDoc.mockResolvedValue(undefined);
    firebaseStorageService.uploadImage.mockReset();
    firebaseStorageService.uploadImage.mockImplementation((_: File, fileName: string) =>
      of({
        fileName,
        downloadUrl: `https://cdn.example.com/${fileName}`
      })
    );
    pipelineService.refreshAllDestinationsCache.mockReset();
    pipelineService.refreshAllDestinationsCache.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        FirebaseDestinationUploadService,
        {
          provide: FIREBASE_FIRESTORE,
          useValue: { projectId: 'sample-project' }
        },
        {
          provide: FirebaseStorageService,
          useValue: firebaseStorageService
        },
        {
          provide: FirestoreDestinationPipelineService,
          useValue: pipelineService
        }
      ]
    });
  });

  it('uploads assets, stores file names in Firestore, refreshes cache, and returns resolved URLs', async () => {
    const service = TestBed.inject(FirebaseDestinationUploadService);
    const draft = createDraft();
    const result = await firstValueFrom(service.upload(draft));

    expect(firebaseStorageService.uploadImage).toHaveBeenNthCalledWith(
      1,
      draft.files.imageBig,
      'destination-123-imageBig.jpg'
    );
    expect(firebaseStorageService.uploadImage).toHaveBeenNthCalledWith(
      2,
      draft.files.image1,
      'destination-123-image1.png'
    );
    expect(firebaseStorageService.uploadImage).toHaveBeenNthCalledWith(
      3,
      draft.files.image2,
      'destination-123-image2.webp'
    );
    expect(firebaseStorageService.uploadImage).toHaveBeenNthCalledWith(
      4,
      draft.files.image3,
      'destination-123-image3.jpg'
    );
    expect(setDoc).toHaveBeenCalledWith(firestoreMockState.docRef, {
      id: 'destination-123',
      country: 'Japan',
      city: 'Tokyo',
      latitude: 35.68,
      longitude: 139.76,
      description: 'A city break destination.',
      title: 'Tokyo Lights',
      smallTitle: 'Japan',
      imageBig: 'destination-123-imageBig.jpg',
      imageBigAuthorInfo: 'Hero credit',
      image1: 'destination-123-image1.png',
      image1AuthorInfo: 'Image 1 credit',
      image2: 'destination-123-image2.webp',
      image2AuthorInfo: 'Image 2 credit',
      image3: 'destination-123-image3.jpg',
      image3AuthorInfo: 'Image 3 credit',
      price: 1299,
      video: 'https://youtu.be/demo'
    });
    expect(pipelineService.refreshAllDestinationsCache).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: 'destination-123',
      country: 'Japan',
      city: 'Tokyo',
      latitude: 35.68,
      longitude: 139.76,
      description: 'A city break destination.',
      title: 'Tokyo Lights',
      smallTitle: 'Japan',
      imageBig: 'https://cdn.example.com/destination-123-imageBig.jpg',
      imageBigAuthorInfo: 'Hero credit',
      image1: 'https://cdn.example.com/destination-123-image1.png',
      image1AuthorInfo: 'Image 1 credit',
      image2: 'https://cdn.example.com/destination-123-image2.webp',
      image2AuthorInfo: 'Image 2 credit',
      image3: 'https://cdn.example.com/destination-123-image3.jpg',
      image3AuthorInfo: 'Image 3 credit',
      price: 1299,
      video: 'https://youtu.be/demo'
    });
  });

  it('propagates upload failures before writing to Firestore', async () => {
    const service = TestBed.inject(FirebaseDestinationUploadService);
    const draft = createDraft();
    firebaseStorageService.uploadImage.mockReturnValueOnce(
      throwError(() => new Error('storage failed'))
    );

    await expect(firstValueFrom(service.upload(draft))).rejects.toThrow(
      'storage failed'
    );
    expect(setDoc).not.toHaveBeenCalled();
    expect(pipelineService.refreshAllDestinationsCache).not.toHaveBeenCalled();
  });

  it('propagates Firestore write failures without refreshing the cache', async () => {
    const service = TestBed.inject(FirebaseDestinationUploadService);
    const draft = createDraft();
    firestoreMockState.setDoc.mockRejectedValueOnce(new Error('firestore failed'));

    await expect(firstValueFrom(service.upload(draft))).rejects.toThrow(
      'firestore failed'
    );
    expect(pipelineService.refreshAllDestinationsCache).not.toHaveBeenCalled();
  });

  it('propagates cache refresh failures after the Firestore write succeeds', async () => {
    const service = TestBed.inject(FirebaseDestinationUploadService);
    const draft = createDraft();
    pipelineService.refreshAllDestinationsCache.mockReturnValueOnce(
      throwError(() => new Error('cache refresh failed'))
    );

    await expect(firstValueFrom(service.upload(draft))).rejects.toThrow(
      'cache refresh failed'
    );
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});
