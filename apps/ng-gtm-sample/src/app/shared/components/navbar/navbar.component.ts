import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';
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
    private readonly navigationService: NavigationService
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

  logout() {
    this.authService.logout().subscribe();
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

  user() {
    return this.authService.getUser()();
  }

  cartItemCount() {
    return this.orderService.orders$().length;
  }
}
