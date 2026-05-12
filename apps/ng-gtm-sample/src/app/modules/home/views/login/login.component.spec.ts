import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const userSignal = signal<User | undefined>(undefined);
  const authServiceMock = {
    getUser: vi.fn(() => userSignal),
    loginWithGoogle: vi.fn(() => of(undefined))
  };
  const navigationServiceMock = {
    navigateToAdmin: vi.fn()
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    userSignal.set(undefined);
    authServiceMock.getUser.mockClear();
    authServiceMock.loginWithGoogle.mockClear();
    navigationServiceMock.navigateToAdmin.mockClear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        },
        {
          provide: NavigationService,
          useValue: navigationServiceMock
        }
      ]
    }).compileComponents();
  });

  it('redirects authenticated users to the admin dashboard', () => {
    userSignal.set({ uid: 'admin-user' } as User);

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(navigationServiceMock.navigateToAdmin).toHaveBeenCalledTimes(1);
  });

  it('starts the Google sign-in flow when the CTA is pressed', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.componentInstance.loginWithGoogle();

    expect(authServiceMock.loginWithGoogle).toHaveBeenCalledTimes(1);
  });
});
