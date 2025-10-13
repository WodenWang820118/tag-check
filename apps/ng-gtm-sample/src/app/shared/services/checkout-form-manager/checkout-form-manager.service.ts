import { computed, inject, Injectable, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AnalyticsService } from '../analytics/analytics.service';
import { OrderService } from '../order/order.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutFormManagerService {
  private readonly fb = inject(FormBuilder);
  shippingForm = this.fb.group({
    name: [''],
    address: [''],
    zip: [''],
    city: ['']
  });

  paymentForm = this.fb.group({
    cardNum: [''],
    expiration: [''],
    security: ['']
  });

  isShippingFormSubmitted = signal<boolean>(false);
  isPaymentFormSubmitted = signal<boolean>(false);
  isShippingFormSubmitted$ = computed(() => this.isShippingFormSubmitted());
  isPaymentFormSubmitted$ = computed(() => this.isPaymentFormSubmitted());

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly orderService: OrderService
  ) {}

  shippingFormComplete() {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.isShippingFormSubmitted.set(true);
      this.analyticsService.trackEvent('add_shipping_info', orders);
    }
  }

  paymentFormComplete() {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.isPaymentFormSubmitted.set(true);
      this.analyticsService.trackEvent('add_payment_info', orders);
    }
  }
}
