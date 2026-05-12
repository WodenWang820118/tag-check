import { makeEnvironmentProviders } from '@angular/core';
import { FirebaseClientConfig } from './firebase.config';
import { provideFirebaseApp } from './provide-firebase-app';
import { provideFirebaseAuthClient } from './provide-firebase-auth';
import { provideFirebaseDataClients } from './provide-firebase-data';

export function provideFirebaseClients(config: FirebaseClientConfig) {
  return makeEnvironmentProviders([
    provideFirebaseApp(config),
    provideFirebaseAuthClient(),
    provideFirebaseDataClients()
  ]);
}
