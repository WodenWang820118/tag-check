import { makeEnvironmentProviders } from '@angular/core';
import { getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  FIREBASE_APP,
  FIREBASE_FIRESTORE,
  FIREBASE_STORAGE
} from './firebase.tokens';

export function provideFirebaseDataClients() {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_FIRESTORE,
      useFactory: (app: ReturnType<typeof getApp>) => getFirestore(app),
      deps: [FIREBASE_APP]
    },
    {
      provide: FIREBASE_STORAGE,
      useFactory: (app: ReturnType<typeof getApp>) => getStorage(app),
      deps: [FIREBASE_APP]
    }
  ]);
}
