import { CurrencyPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { OrderService } from '../../../../shared/services/order/order.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-thankyou',
  standalone: true,
  imports: [ButtonModule, CardModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './thankyou.component.html'
})
export class ThankyouComponent {
  constructor(
    public readonly orderService: OrderService,
    private readonly analyticsService: AnalyticsService,
    private readonly navigationService: NavigationService
  ) {}

  resetOrders(): void {
    this.orderService.resetOrders();
    this.navigationService.navigateToHome();
  }

  trackRefund(): void {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.analyticsService.trackEvent('refund', orders);
    }
  }

  cancelOrder(): void {
    this.trackRefund();
    this.resetOrders();
  }
}
