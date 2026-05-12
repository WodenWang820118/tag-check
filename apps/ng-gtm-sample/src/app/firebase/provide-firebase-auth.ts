import { makeEnvironmentProviders } from '@angular/core';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FIREBASE_APP, FIREBASE_AUTH } from './firebase.tokens';

export function provideFirebaseAuthClient() {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_AUTH,
      useFactory: (app: ReturnType<typeof getApp>) => getAuth(app),
      deps: [FIREBASE_APP]
    }
  ]);
}
