import { makeEnvironmentProviders } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FirebaseClientConfig } from './firebase.config';
import {
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIREBASE_CLIENT_CONFIG,
  FIREBASE_FIRESTORE,
  FIREBASE_STORAGE
} from './firebase.tokens';

export function provideFirebaseClients(config: FirebaseClientConfig) {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_CLIENT_CONFIG,
      useValue: config
    },
    {
      provide: FIREBASE_APP,
      useFactory: () =>
        getApps().length > 0 ? getApp() : initializeApp(config)
    },
    {
      provide: FIREBASE_AUTH,
      useFactory: (app: ReturnType<typeof getApp>) => getAuth(app),
      deps: [FIREBASE_APP]
    },
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
