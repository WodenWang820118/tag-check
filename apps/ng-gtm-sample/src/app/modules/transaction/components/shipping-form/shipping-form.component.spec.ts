import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { Order } from '../../../../shared/models/order.model';
import { ShippingFormComponent } from './shipping-form.component';

describe('ShippingFormComponent', () => {
  let fixture: ComponentFixture<ShippingFormComponent>;
  let component: ShippingFormComponent;

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

  beforeEach(async () => {
    TestBed.resetTestingModule();
    analyticsServiceMock.trackEvent.mockReset();
    orderServiceMock.orders$.set(mockOrders);

    await TestBed.configureTestingModule({
      imports: [ShippingFormComponent],
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
    }).compileComponents();

    fixture = TestBed.createComponent(ShippingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('updates the Signal Form values when typing into inputs by data-testid and tracks add_shipping_info on submit', () => {
    const nameInput = fixture.nativeElement.querySelector(
      '[data-testid="shipping-name"]'
    ) as HTMLInputElement | null;
    const addressInput = fixture.nativeElement.querySelector(
      '[data-testid="shipping-address"]'
    ) as HTMLInputElement | null;
    const zipInput = fixture.nativeElement.querySelector(
      '[data-testid="shipping-zip"]'
    ) as HTMLInputElement | null;
    const cityInput = fixture.nativeElement.querySelector(
      '[data-testid="shipping-city"]'
    ) as HTMLInputElement | null;

    expect(nameInput).not.toBeNull();
    expect(addressInput).not.toBeNull();
    expect(zipInput).not.toBeNull();
    expect(cityInput).not.toBeNull();

    if (!nameInput || !addressInput || !zipInput || !cityInput) {
      throw new Error('Expected shipping form inputs to be present');
    }

    nameInput.value = 'Jane Doe';
    nameInput.dispatchEvent(new Event('input'));

    addressInput.value = '100 Main St';
    addressInput.dispatchEvent(new Event('input'));

    zipInput.value = '90210';
    zipInput.dispatchEvent(new Event('input'));

    cityInput.value = 'Beverly Hills';
    cityInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(component.shippingForm.name().value()).toBe('Jane Doe');
    expect(component.shippingForm.address().value()).toBe('100 Main St');
    expect(component.shippingForm.zip().value()).toBe('90210');
    expect(component.shippingForm.city().value()).toBe('Beverly Hills');
    expect(component.checkoutFormManager.shippingModel()).toEqual({
      name: 'Jane Doe',
      address: '100 Main St',
      zip: '90210',
      city: 'Beverly Hills'
    });

    const submitButton = fixture.nativeElement.querySelector(
      '[data-testid="shipping-continue"]'
    ) as HTMLButtonElement | null;

    expect(submitButton).not.toBeNull();
    submitButton?.click();
    fixture.detectChanges();

    expect(component.checkoutFormManager.isShippingFormSubmitted()).toBe(true);
    expect(analyticsServiceMock.trackEvent).toHaveBeenCalledWith(
      'add_shipping_info',
      mockOrders
    );
  });
});
