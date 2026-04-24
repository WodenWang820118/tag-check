import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseClientConfig } from './firebase.config';
import { provideFirebaseClients } from './provide-firebase';
import {
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIREBASE_CLIENT_CONFIG,
  FIREBASE_FIRESTORE,
  FIREBASE_STORAGE
} from './firebase.tokens';

const firebaseSdkState = vi.hoisted(() => ({
  apps: [] as Array<{ name: string; options: FirebaseClientConfig }>,
  initializeApp: vi.fn((config: FirebaseClientConfig) => {
    const app = {
      name: `app-${firebaseSdkState.apps.length + 1}`,
      options: config
    };
    firebaseSdkState.apps.push(app);
    return app;
  }),
  getAuth: vi.fn((app: { name: string }) => ({
    app,
    kind: 'auth'
  })),
  getFirestore: vi.fn((app: { name: string }) => ({
    app,
    kind: 'firestore'
  })),
  getStorage: vi.fn((app: { name: string }) => ({
    app,
    kind: 'storage'
  }))
}));

vi.mock('firebase/app', () => ({
  getApps: vi.fn(() => firebaseSdkState.apps),
  getApp: vi.fn(() => firebaseSdkState.apps[0]),
  initializeApp: firebaseSdkState.initializeApp
}));

vi.mock('firebase/auth', () => ({
  getAuth: firebaseSdkState.getAuth
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: firebaseSdkState.getFirestore
}));

vi.mock('firebase/storage', () => ({
  getStorage: firebaseSdkState.getStorage
}));

import { getApp } from 'firebase/app';

const firebaseConfig: FirebaseClientConfig = {
  apiKey: 'api-key',
  authDomain: 'sample.example.com',
  projectId: 'sample-project',
  storageBucket: 'sample.appspot.com',
  messagingSenderId: '1234567890',
  appId: 'app-id'
};

describe('provideFirebaseClients', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    firebaseSdkState.apps = [];
    firebaseSdkState.initializeApp.mockClear();
    firebaseSdkState.getAuth.mockClear();
    firebaseSdkState.getFirestore.mockClear();
    firebaseSdkState.getStorage.mockClear();
  });

  it('provides Firebase config and clients backed by the same app instance', () => {
    TestBed.configureTestingModule({
      providers: [provideFirebaseClients(firebaseConfig)]
    });

    const config = TestBed.inject(FIREBASE_CLIENT_CONFIG);
    const app = TestBed.inject(FIREBASE_APP);
    const auth = TestBed.inject(FIREBASE_AUTH);
    const firestore = TestBed.inject(FIREBASE_FIRESTORE);
    const storage = TestBed.inject(FIREBASE_STORAGE);

    expect(config).toEqual(firebaseConfig);
    expect(firebaseSdkState.initializeApp).toHaveBeenCalledWith(firebaseConfig);
    expect(auth.app).toBe(app);
    expect(firestore.app).toBe(app);
    expect(storage.app).toBe(app);
  });

  it('reuses the existing app instead of re-initializing Firebase', () => {
    const secondConfig = {
      ...firebaseConfig,
      projectId: 'second-project'
    };
    const existingApp = {
      name: 'existing-app',
      options: firebaseConfig
    };
    firebaseSdkState.apps = [existingApp];

    TestBed.configureTestingModule({
      providers: [
        provideFirebaseClients(secondConfig)
      ]
    });

    const config = TestBed.inject(FIREBASE_CLIENT_CONFIG);
    const app = TestBed.inject(FIREBASE_APP);
    const auth = TestBed.inject(FIREBASE_AUTH);
    const firestore = TestBed.inject(FIREBASE_FIRESTORE);
    const storage = TestBed.inject(FIREBASE_STORAGE);

    expect(config).toEqual(secondConfig);
    expect(app).toBe(existingApp);
    expect(getApp).toHaveBeenCalledTimes(1);
    expect(firebaseSdkState.initializeApp).not.toHaveBeenCalled();
    expect(auth.app).toBe(existingApp);
    expect(firestore.app).toBe(existingApp);
    expect(storage.app).toBe(existingApp);
  });
});
