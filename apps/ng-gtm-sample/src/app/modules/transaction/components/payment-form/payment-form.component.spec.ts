import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { Order } from '../../../../shared/models/order.model';
import { PaymentFormComponent } from './payment-form.component';

describe('PaymentFormComponent', () => {
  let fixture: ComponentFixture<PaymentFormComponent>;
  let component: PaymentFormComponent;

  const mockOrders: Order[] = [
    {
      id: 'order-1',
      title: 'Tokyo',
      category: 'Asia',
      quantity: 1,
      date: new Date('2026-01-01T00:00:00Z'),
      image: '',
      currency: 'USD',
      value: 1000
    }
  ];

  const analyticsServiceMock = {
    trackEvent: vi.fn()
  };

  const orderServiceMock = {
    orders$: signal<Order[]>(mockOrders)
  };

  const navigationServiceMock = {
    navigateToThankYou: vi.fn()
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    analyticsServiceMock.trackEvent.mockReset();
    navigationServiceMock.navigateToThankYou.mockReset();
    orderServiceMock.orders$.set(mockOrders);

    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
      providers: [
        CheckoutFormManagerService,
        {
          provide: AnalyticsService,
          useValue: analyticsServiceMock
        },
        {
          provide: OrderService,
          useValue: orderServiceMock
        },
        {
          provide: NavigationService,
          useValue: navigationServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    component.checkoutFormManager.isShippingFormSubmitted.set(true);
    fixture.detectChanges();
  });

  it('updates the Signal Form values when typing into inputs by data-testid and tracks add_payment_info and purchase on order placement', () => {
    const cardNumInput = fixture.nativeElement.querySelector(
      '[data-testid="payment-cardNum"]'
    ) as HTMLInputElement | null;
    const expirationInput = fixture.nativeElement.querySelector(
      '[data-testid="payment-expiration"]'
    ) as HTMLInputElement | null;
    const securityInput = fixture.nativeElement.querySelector(
      '[data-testid="payment-security"]'
    ) as HTMLInputElement | null;

    expect(cardNumInput).not.toBeNull();
    expect(expirationInput).not.toBeNull();
    expect(securityInput).not.toBeNull();

    if (!cardNumInput || !expirationInput || !securityInput) {
      throw new Error('Expected payment form inputs to be present');
    }

    cardNumInput.value = '4111222233334444';
    cardNumInput.dispatchEvent(new Event('input'));

    expirationInput.value = '12/28';
    expirationInput.dispatchEvent(new Event('input'));

    securityInput.value = '123';
    securityInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(component.paymentForm.cardNum().value()).toBe('4111222233334444');
    expect(component.paymentForm.expiration().value()).toBe('12/28');
    expect(component.paymentForm.security().value()).toBe('123');
    expect(component.checkoutFormManager.paymentModel()).toEqual({
      cardNum: '4111222233334444',
      expiration: '12/28',
      security: '123'
    });

    const placeOrderButton = fixture.nativeElement.querySelector(
      '[data-testid="place-order"]'
    ) as HTMLButtonElement | null;

    expect(placeOrderButton).not.toBeNull();
    placeOrderButton?.click();
    fixture.detectChanges();

    expect(component.checkoutFormManager.isPaymentFormSubmitted()).toBe(true);
    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'add_payment_info',
      mockOrders
    );
    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'purchase',
      mockOrders
    );
    expect(navigationServiceMock.navigateToThankYou).toHaveBeenCalled();
  });
});
