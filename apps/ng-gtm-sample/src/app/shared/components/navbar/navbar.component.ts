import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { AnalyticsService } from '../../../shared/services/analytics/analytics.service';
import { OrderService } from '../../services/order/order.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, ToolbarModule, ButtonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  constructor(
    public readonly authService: AuthService,
    private readonly orderService: OrderService,
    private readonly analyticsService: AnalyticsService,
    private readonly navigationService: NavigationService
  ) {
    // effect(() => {
    //   const orders = this.orderService.orders$();
    //   if (orders.length > 0) {
    //     this.analyticsService.trackEvent('view_cart', orders);
    //   }
    // });
  }

  navigateToHome() {
    this.navigationService.navigateToHome();
  }

  navigateToDestinations() {
    this.navigationService.navigateToDestinations();
  }

  navigateToLogin() {
    this.navigationService.navigateToLogin();
  }

  navigateToAdmin() {
    this.navigationService.navigateToAdmin();
  }

  navigateToAddData() {
    this.navigationService.navigateToAddData();
  }

  navigateToBasket() {
    this.navigationService.navigateToBasket();
  }

  trackViewCart(): void {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.analyticsService.trackEvent('view_cart', orders);
    }
  }

  numOfItemsInCart() {
    return this.orderService.orders$().length;
  }
}
