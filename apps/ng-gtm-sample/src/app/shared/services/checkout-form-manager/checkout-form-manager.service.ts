import { computed, Injectable, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { AnalyticsService } from '../analytics/analytics.service';
import { OrderService } from '../order/order.service';

export interface ShippingFormModel {
  name: string;
  address: string;
  zip: string;
  city: string;
}

export interface PaymentFormModel {
  cardNum: string;
  expiration: string;
  security: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutFormManagerService {
  readonly shippingModel = signal<ShippingFormModel>({
    name: '',
    address: '',
    zip: '',
    city: ''
  });
  readonly shippingForm = form(this.shippingModel);

  readonly paymentModel = signal<PaymentFormModel>({
    cardNum: '',
    expiration: '',
    security: ''
  });
  readonly paymentForm = form(this.paymentModel);

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

  completePurchase() {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.analyticsService.trackEvent('purchase', orders);
    }
  }
}
