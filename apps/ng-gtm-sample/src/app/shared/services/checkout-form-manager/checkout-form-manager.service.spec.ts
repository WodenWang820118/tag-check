import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../analytics/analytics.service';
import { OrderService } from '../order/order.service';
import { Order } from '../../models/order.model';
import { CheckoutFormManagerService } from './checkout-form-manager.service';

describe('CheckoutFormManagerService', () => {
  let service: CheckoutFormManagerService;

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

  beforeEach(() => {
    TestBed.resetTestingModule();
    analyticsServiceMock.trackEvent.mockReset();
    orderServiceMock.orders$.set(mockOrders);

    TestBed.configureTestingModule({
      providers: [
        CheckoutFormManagerService,
        {
          provide: AnalyticsService,
          useValue: analyticsServiceMock
        },
        {
          provide: OrderService,
          useValue: orderServiceMock
        }
      ]
    });

    service = TestBed.inject(CheckoutFormManagerService);
  });

  it('initializes with Signal Forms having empty values and unsubmitted state', () => {
    expect(service.shippingModel()).toEqual({
      name: '',
      address: '',
      zip: '',
      city: ''
    });
    expect(service.paymentModel()).toEqual({
      cardNum: '',
      expiration: '',
      security: ''
    });
    expect(service.isShippingFormSubmitted()).toBe(false);
    expect(service.isPaymentFormSubmitted()).toBe(false);
  });

  it('completes shipping form and calls trackEvent with add_shipping_info', () => {
    service.shippingFormComplete();

    expect(service.isShippingFormSubmitted()).toBe(true);
    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'add_shipping_info',
      mockOrders
    );
  });

  it('completes payment form and calls trackEvent with add_payment_info', () => {
    service.paymentFormComplete();

    expect(service.isPaymentFormSubmitted()).toBe(true);
    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'add_payment_info',
      mockOrders
    );
  });

  it('completes purchase and calls trackEvent with purchase', () => {
    service.completePurchase();

    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'purchase',
      mockOrders
    );
  });
});
