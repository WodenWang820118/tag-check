import { defer, from } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { addDoc, collection } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../../../firebase/firebase.tokens';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDestinationUploadService {
  private readonly firestore = inject(FIREBASE_FIRESTORE);

  upload(data: any) {
    return defer(() =>
      from(
        addDoc(collection(this.firestore, 'destinations'), {
          country: data.country,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
        })
      )
    );
  }
}
