import { inject, Injectable } from '@angular/core';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { catchError, defer, from, map, of, switchMap } from 'rxjs';
import { FIREBASE_STORAGE } from '../../../firebase/firebase.tokens';

@Injectable()
export class FirebaseStorageService {
  private readonly bucket = inject(FIREBASE_STORAGE);

  getImage(name: string) {
    if (!name) return of('');
    if (/^(https?:)?\/\//.test(name) || name.startsWith('data:')) {
      return of(name);
    }
    return defer(() =>
      from(getDownloadURL(ref(this.bucket, `images/${name}`))).pipe(
        catchError((error) => {
          console.log('Error getting image', error);
          return of('');
        })
      )
    );
  }

  uploadImage(file: File, fileName: string) {
    const storageRef = ref(this.bucket, `images/${fileName}`);
    return defer(() =>
      from(uploadBytes(storageRef, file)).pipe(
        switchMap(() => from(getDownloadURL(storageRef))),
        map((downloadUrl) => ({
          fileName,
          downloadUrl
        }))
      )
    );
  }
}
