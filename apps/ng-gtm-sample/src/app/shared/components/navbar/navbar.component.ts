import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
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

  navigateToBasket() {
    this.navigationService.navigateToBasket();
  }

  cartItemCount() {
    return this.orderService.orders$().length;
  }
}
