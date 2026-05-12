import { defer, forkJoin, from, map, Observable, switchMap } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../../../firebase/firebase.tokens';
import { FirebaseStorageService } from '../firebase-storage/firebase-storage.service';
import {
  CreateDestinationDraft,
  DestinationImageSlot
} from '../../models/create-destination-draft.model';
import { Destination } from '../../models/destination.model';
import { FirestoreDestinationPipelineService } from '../firestore-destination-pipeline/firestore-destination-pipeline.service';

type UploadedDestinationAssets = Record<
  DestinationImageSlot,
  { fileName: string; downloadUrl: string }
>;

@Injectable()
export class FirebaseDestinationUploadService {
  private readonly firestore = inject(FIREBASE_FIRESTORE);
  private readonly firebaseStorageService = inject(FirebaseStorageService);
  private readonly firestoreDestinationPipelineService = inject(
    FirestoreDestinationPipelineService
  );

  upload(data: CreateDestinationDraft): Observable<Destination> {
    return defer(() => {
      const destinationRef = doc(collection(this.firestore, 'destinations'));
      const destinationId = destinationRef.id;

      return this.uploadDestinationAssets(destinationId, data).pipe(
        switchMap((uploadedAssets) => {
          const firestoreDocument = this.toFirestoreDocument(
            destinationId,
            data,
            uploadedAssets
          );
          const destination = this.toDestination(
            destinationId,
            data,
            uploadedAssets
          );

          return from(setDoc(destinationRef, firestoreDocument)).pipe(
            switchMap(() =>
              this.firestoreDestinationPipelineService.refreshAllDestinationsCache()
            ),
            map(() => destination)
          );
        })
      );
    });
  }

  private uploadDestinationAssets(
    destinationId: string,
    data: CreateDestinationDraft
  ): Observable<UploadedDestinationAssets> {
    const slots = Object.entries(data.files) as [DestinationImageSlot, File][];

    return forkJoin(
      slots.map(([slot, file]) => {
        const fileName = this.buildImageFileName(destinationId, slot, file);
        return this.firebaseStorageService
          .uploadImage(file, fileName)
          .pipe(map((uploadedImage) => [slot, uploadedImage] as const));
      })
    ).pipe(
      map(
        (uploadedAssets) =>
          Object.fromEntries(uploadedAssets) as UploadedDestinationAssets
      )
    );
  }

  private buildImageFileName(
    destinationId: string,
    slot: DestinationImageSlot,
    file: File
  ) {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    return `${destinationId}-${slot}.${extension}`;
  }

  private toFirestoreDocument(
    destinationId: string,
    data: CreateDestinationDraft,
    uploadedAssets: UploadedDestinationAssets
  ) {
    return {
      id: destinationId,
      country: data.country,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      title: data.title,
      smallTitle: data.smallTitle,
      imageBig: uploadedAssets.imageBig.fileName,
      imageBigAuthorInfo: data.imageBigAuthorInfo,
      image1: uploadedAssets.image1.fileName,
      image1AuthorInfo: data.image1AuthorInfo,
      image2: uploadedAssets.image2.fileName,
      image2AuthorInfo: data.image2AuthorInfo,
      image3: uploadedAssets.image3.fileName,
      image3AuthorInfo: data.image3AuthorInfo,
      price: data.price,
      video: data.video
    };
  }

  private toDestination(
    destinationId: string,
    data: CreateDestinationDraft,
    uploadedAssets: UploadedDestinationAssets
  ): Destination {
    return {
      id: destinationId,
      country: data.country,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      title: data.title,
      smallTitle: data.smallTitle,
      imageBig: uploadedAssets.imageBig.downloadUrl,
      imageBigAuthorInfo: data.imageBigAuthorInfo,
      image1: uploadedAssets.image1.downloadUrl,
      image1AuthorInfo: data.image1AuthorInfo,
      image2: uploadedAssets.image2.downloadUrl,
      image2AuthorInfo: data.image2AuthorInfo,
      image3: uploadedAssets.image3.downloadUrl,
      image3AuthorInfo: data.image3AuthorInfo,
      price: data.price,
      video: data.video
    };
  }
}
