import { Component } from '@angular/core';
import { OrderService } from '../../../../shared/services/order/order.service';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-thankyou',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './thankyou.component.html'
})
export class ThankyouComponent {
  constructor(
    public orderService: OrderService,
    private readonly analyticsService: AnalyticsService,
    private readonly navigationService: NavigationService
  ) {}

  resetOrders(): void {
    this.orderService.resetOrders();
    this.navigationService.navigateToHome();
  }

  // the purchase event is tracked in the analytics service using URL to determine when to track the event
  trackRefund(): void {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.analyticsService.trackEvent('refund', orders);
    }
  }

  /** refund and then navigate home */
  cancelOrder(): void {
    this.trackRefund();
    this.resetOrders();
  }
}
