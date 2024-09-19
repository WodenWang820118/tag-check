import { Injectable } from '@nestjs/common';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
@Injectable()
export class FirebaseService {
  private firebaseConfig = {
    apiKey: 'AIzaSyBZRw2g0nOOAhVBflSB_-7YWdu4sGA2OdM',
    authDomain: 'tag-check-e625f.firebaseapp.com',
    projectId: 'tag-check-e625f',
    storageBucket: 'tag-check-e625f.appspot.com',
    messagingSenderId: '67832177682',
    appId: '1:67832177682:web:73335c7e59c03cd2ef24cb',
    measurementId: 'G-MT39PJ7SZK',
  };

  private ERROR_COLLECTION = 'errors';
  private app = initializeApp(this.firebaseConfig);

  getAuth() {
    return getAuth(this.app);
  }

  getStorage() {
    return getStorage(this.app);
  }

  getFirestore() {
    return getFirestore(this.app);
  }

  getErrorCollectionName() {
    return this.ERROR_COLLECTION;
  }
}
