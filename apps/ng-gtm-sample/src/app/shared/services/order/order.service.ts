import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { Destination } from '../../../shared/models/destination.model';
import { Order } from '../../../shared/models/order.model';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _orders = signal<Order[]>([]);
  readonly orders$ = computed(() => this._orders());
  readonly totalPrice$ = this.calculateTotalPrice();

  constructor(private readonly analyticsService: AnalyticsService) {
    this.loadInitialData();
  }

  addToCart(destination: Destination, numOfPersons: number): void {
    const order = this.createOrder(destination, numOfPersons);
    const currentOrders = this._orders();
    const duplicateOrderIndex = currentOrders.findIndex(
      (o) => o.id === order.id
    );
    const updatedOrders =
      duplicateOrderIndex === -1
        ? [...currentOrders, order]
        : currentOrders.map((currentOrder, index) =>
            index === duplicateOrderIndex
              ? this.updateOrderQuantity(currentOrder, order.quantity)
              : currentOrder
          );

    this._orders.set(updatedOrders);
    this.storeOrders(updatedOrders);
    this.analyticsService.trackEvent('add_to_cart', [order]);
  }

  removeFromCart(order: Order): void {
    const currentOrders = this.orders$();
    const updatedOrders = currentOrders.filter((item) => item.id !== order.id);
    this._orders.set(updatedOrders);
    this.analyticsService.trackEvent('remove_from_cart', [order]);
    this.storeOrders(updatedOrders);
  }

  beginCheckout(): void {
    this.analyticsService.trackEvent('begin_checkout', this._orders());
  }

  calculateTotalPrice() {
    return computed(() =>
      this.orders$().reduce(
        (total, order) => total + order.value * order.quantity,
        0
      )
    );
  }

  resetOrders(): void {
    this._orders.set([]);
    this.storeOrders([]);
  }

  private loadInitialData(): void {
    if (!this.browser) {
      this._orders.set([]);
      return;
    }

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    this._orders.set(orders);
  }

  private storeOrders(orders: Order[]): void {
    if (this.browser) {
      localStorage.setItem('orders', JSON.stringify(orders));
    }

    this.analyticsService.setCheckoutOrders(orders);
  }

  private createOrder(destination: Destination, numOfPersons: number): Order {
    return {
      id: destination.id,
      title: destination.title,
      category: destination.title,
      value: destination.price,
      quantity: numOfPersons,
      date: new Date(),
      image: destination.image1,
      currency: 'USD'
    };
  }

  private updateOrderQuantity(order: Order, quantity: number): Order {
    return {
      ...order,
      quantity
    };
  }
}
