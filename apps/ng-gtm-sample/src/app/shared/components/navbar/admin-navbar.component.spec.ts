import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminNavbarComponent } from './admin-navbar.component';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { OrderService } from '../../services/order/order.service';

describe('AdminNavbarComponent', () => {
  const authServiceMock = {
    logout: vi.fn(() => of(undefined)),
    getUser: vi.fn(() => () => undefined)
  };
  const navigationServiceMock = {
    navigateToHome: vi.fn(),
    navigateToDestinations: vi.fn(),
    navigateToLogin: vi.fn(),
    navigateToAdmin: vi.fn(),
    navigateToAddData: vi.fn(),
    navigateToBasket: vi.fn()
  };
  const orderServiceMock = {
    orders$: vi.fn(() => [])
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    authServiceMock.logout.mockClear();
    authServiceMock.getUser.mockClear();
    navigationServiceMock.navigateToHome.mockClear();

    await TestBed.configureTestingModule({
      imports: [AdminNavbarComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceMock
        },
        {
          provide: NavigationService,
          useValue: navigationServiceMock
        },
        {
          provide: OrderService,
          useValue: orderServiceMock
        }
      ]
    }).compileComponents();
  });

  it('returns visitors to the public home route after logout completes', () => {
    const fixture = TestBed.createComponent(AdminNavbarComponent);
    fixture.detectChanges();

    fixture.componentInstance.logout();

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(navigationServiceMock.navigateToHome).toHaveBeenCalledTimes(1);
  });
});
