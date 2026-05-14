import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { OrderService } from '../../services/order/order.service';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [RouterModule, ToolbarModule, ButtonModule],
  templateUrl: './admin-navbar.component.html'
})
export class AdminNavbarComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService,
    private readonly orderService: OrderService
  ) {}

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

  logout() {
    this.authService.logout().subscribe(() => {
      this.navigationService.navigateToHome();
    });
  }

  user() {
    return this.authService.getUser()();
  }

  cartItemCount() {
    return this.orderService.orders$().length;
  }
}
