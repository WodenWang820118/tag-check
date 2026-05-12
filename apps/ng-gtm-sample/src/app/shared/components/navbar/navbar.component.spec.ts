import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavbarComponent } from './navbar.component';
import { NavigationService } from '../../services/navigation/navigation.service';
import { OrderService } from '../../services/order/order.service';

describe('NavbarComponent', () => {
  const navigationServiceMock = {
    navigateToHome: vi.fn(),
    navigateToDestinations: vi.fn(),
    navigateToLogin: vi.fn(),
    navigateToBasket: vi.fn()
  };
  const orderServiceMock = {
    orders$: vi.fn(() => [])
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    navigationServiceMock.navigateToLogin.mockClear();

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
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

  it('renders an Admin Area CTA that still routes through the login page', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent as string;

    expect(textContent).toContain('Admin Area');

    fixture.componentInstance.navigateToLogin();

    expect(navigationServiceMock.navigateToLogin).toHaveBeenCalledTimes(1);
  });
});
