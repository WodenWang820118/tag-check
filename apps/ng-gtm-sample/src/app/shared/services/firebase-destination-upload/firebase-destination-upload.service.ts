import { defer, from } from 'rxjs';
import { Injectable } from '@angular/core';
import { firestore } from '../../../firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDestinationUploadService {
  upload(data: any) {
    return defer(() =>
      from(
        setDoc(doc(firestore, 'destinations'), {
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
