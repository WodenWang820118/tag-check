import { makeEnvironmentProviders } from '@angular/core';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { FirebaseClientConfig } from './firebase.config';
import { FIREBASE_APP, FIREBASE_CLIENT_CONFIG } from './firebase.tokens';

export function provideFirebaseApp(config: FirebaseClientConfig) {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_CLIENT_CONFIG,
      useValue: config
    },
    {
      provide: FIREBASE_APP,
      useFactory: () =>
        getApps().length > 0 ? getApp() : initializeApp(config)
    }
  ]);
}
