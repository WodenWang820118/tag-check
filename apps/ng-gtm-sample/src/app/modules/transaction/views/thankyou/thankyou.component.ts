import { CurrencyPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideHouse, lucideUndo2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard } from '@spartan-ng/helm/card';
import { OrderService } from '../../../../shared/services/order/order.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-thankyou',
  standalone: true,
  imports: [HlmButton, HlmCard, NgIcon, CurrencyPipe],
  providers: [provideIcons({ lucideCircleCheck, lucideHouse, lucideUndo2 })],
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
