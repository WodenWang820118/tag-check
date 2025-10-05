import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { DataViewModule } from 'primeng/dataview';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { OrderService } from '../../../../shared/services/order/order.service';
import { Order } from '../../../../shared/models/order.model';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { CurrencyPipe } from '@angular/common';

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
export class BasketComponent {
  public readonly orderService = inject(OrderService);
  basketItems$ = this.orderService.orders$;

  constructor(
    public windowSizeService: WindowSizeService,
    private readonly navigationService: NavigationService
  ) {}

  navigateToBeginCheckout() {
    this.navigationService.navigateToCheckout();
  }

  updateCart(orderId: string) {
    this.navigationService.navigateToDetail(orderId);
  }

  removeFromCart(order: Order): void {
    this.orderService.removeFromCart(order);
  }

  calculateTotalPrice() {
    return this.orderService.calculateTotalPrice();
  }

  beginCheckout() {
    this.orderService.beginCheckout();
  }
}
