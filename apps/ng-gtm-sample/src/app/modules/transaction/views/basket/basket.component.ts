import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { Order } from '../../../../shared/models/order.model';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-basket',
  imports: [
    TableModule,
    DataViewModule,
    CardModule,
    ButtonModule,
    MessageModule,
    CurrencyPipe
  ],
  templateUrl: './basket.component.html'
})
export class BasketComponent implements OnInit {
  public readonly orderService = inject(OrderService);
  readonly basketItems$ = this.orderService.orders$;
  readonly cartTotal = this.orderService.calculateTotalPrice();

  constructor(
    public readonly windowSizeService: WindowSizeService,
    private readonly analyticsService: AnalyticsService,
    private readonly navigationService: NavigationService
  ) {}

  ngOnInit() {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.analyticsService.trackEvent('view_cart', orders);
    }
  }

  navigateToBeginCheckout() {
    this.navigationService.navigateToCheckout();
  }

  updateCart(orderId: string) {
    this.navigationService.navigateToDetail(orderId);
  }

  removeFromCart(order: Order): void {
    this.orderService.removeFromCart(order);
  }

  beginCheckout() {
    this.orderService.beginCheckout();
  }
}
