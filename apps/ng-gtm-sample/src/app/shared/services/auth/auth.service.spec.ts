import {
  createEnvironmentInjector,
  EnvironmentInjector,
  NgZone
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../analytics/analytics.service';
import { FIREBASE_AUTH } from '../../../firebase/firebase.tokens';
import { AuthService } from './auth.service';

const authMockState = vi.hoisted(() => ({
  callback: undefined as ((user: unknown) => void) | undefined,
  unsubscribe: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  onAuthStateChanged: vi.fn((_auth: unknown, callback: (user: unknown) => void) => {
    authMockState.callback = callback;
    return authMockState.unsubscribe;
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn()
}));

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';

describe('AuthService', () => {
  const firebaseAuth = { name: 'firebase-auth' } as any;
  const analyticsService = {
    trackEvent: vi.fn()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    analyticsService.trackEvent.mockReset();
    authMockState.callback = undefined;
    authMockState.unsubscribe.mockReset();
    vi.mocked(onAuthStateChanged).mockClear();
    vi.mocked(signInWithPopup).mockReset();
    vi.mocked(signOut).mockReset();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: FIREBASE_AUTH,
          useValue: firebaseAuth
        },
        {
          provide: AnalyticsService,
          useValue: analyticsService
        },
        {
          provide: NgZone,
          useFactory: () => new NgZone({ enableLongStackTrace: false })
        }
      ]
    });
  });

  it('syncs the user signal from onAuthStateChanged', () => {
    const service = TestBed.inject(AuthService);
    const user = { uid: 'user-1', displayName: 'Travel Admin' } as any;

    expect(onAuthStateChanged).toHaveBeenCalledWith(
      firebaseAuth,
      expect.any(Function)
    );

    authMockState.callback?.(user);
    expect(service.getUser()()).toBe(user);
    expect(service.isLoggedIn()()).toBe(true);

    authMockState.callback?.(null);
    expect(service.getUser()()).toBeUndefined();
    expect(service.isLoggedIn()()).toBe(false);
  });

  it('returns the signed-in user and tracks the login event', async () => {
    const service = TestBed.inject(AuthService);
    const user = { uid: 'user-2', displayName: 'Traveler' } as any;

    vi.mocked(signInWithPopup).mockResolvedValue({
      user
    } as any);

    const result = await firstValueFrom(service.loginWithGoogle());

    expect(result).toBe(user);
    expect(service.getUser()()).toBe(user);
    expect(service.isLoggedIn()()).toBe(true);
    expect(signInWithPopup).toHaveBeenCalledWith(
      firebaseAuth,
      expect.any(GoogleAuthProvider)
    );
    expect(analyticsService.trackEvent).toHaveBeenCalledWith('login', {
      method: 'google'
    });
  });

  it('returns undefined and does not track analytics when Google login fails', async () => {
    const service = TestBed.inject(AuthService);
    vi.mocked(signInWithPopup).mockRejectedValue(new Error('popup blocked'));

    const result = await firstValueFrom(service.loginWithGoogle());

    expect(result).toBeUndefined();
    expect(service.getUser()()).toBeUndefined();
    expect(service.isLoggedIn()()).toBe(false);
    expect(analyticsService.trackEvent).not.toHaveBeenCalled();
  });

  it('delegates logout to Firebase Auth', async () => {
    const service = TestBed.inject(AuthService);
    vi.mocked(signOut).mockResolvedValue(undefined);

    const result = await firstValueFrom(service.logout());

    expect(result).toBeUndefined();
    expect(signOut).toHaveBeenCalledWith(firebaseAuth);
  });

  it('swallows logout errors and still completes', async () => {
    const service = TestBed.inject(AuthService);
    vi.mocked(signOut).mockRejectedValue(new Error('network'));

    const result = await firstValueFrom(service.logout());

    expect(result).toBeUndefined();
    expect(signOut).toHaveBeenCalledWith(firebaseAuth);
  });

  it('unsubscribes from auth state changes when the injector is destroyed', () => {
    const childInjector = createEnvironmentInjector(
      [
        AuthService,
        {
          provide: FIREBASE_AUTH,
          useValue: firebaseAuth
        },
        {
          provide: AnalyticsService,
          useValue: analyticsService
        },
        {
          provide: NgZone,
          useFactory: () => new NgZone({ enableLongStackTrace: false })
        }
      ],
      TestBed.inject(EnvironmentInjector)
    );

    childInjector.get(AuthService);
    childInjector.destroy();

    expect(authMockState.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
