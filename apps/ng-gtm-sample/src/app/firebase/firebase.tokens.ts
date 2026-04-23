import { InjectionToken } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseClientConfig } from './firebase.config';

export const FIREBASE_CLIENT_CONFIG = new InjectionToken<FirebaseClientConfig>(
  'FIREBASE_CLIENT_CONFIG'
);
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
export const FIREBASE_FIRESTORE = new InjectionToken<Firestore>(
  'FIREBASE_FIRESTORE'
);
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>(
  'FIREBASE_STORAGE'
);
