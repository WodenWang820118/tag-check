import { inject, Injectable } from '@angular/core';
import { getDownloadURL, ref } from 'firebase/storage';
import { catchError, defer, from, of } from 'rxjs';
import { FIREBASE_STORAGE } from '../../../firebase/firebase.tokens';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  private readonly bucket = inject(FIREBASE_STORAGE);

  getImage(name: string) {
    if (!name) return of('');
    return defer(() =>
      from(getDownloadURL(ref(this.bucket, `images/${name}`))).pipe(
        catchError((error) => {
          console.log('Error getting image', error);
          return of('');
        })
      )
    );
  }
}
