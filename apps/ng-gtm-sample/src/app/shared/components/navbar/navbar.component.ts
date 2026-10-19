import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order/order.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCompass,
  lucideHouse,
  lucideMap,
  lucideShoppingCart,
  lucideUser
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, HlmButton, NgIcon],
  providers: [
    provideIcons({
      lucideCompass,
      lucideHouse,
      lucideMap,
      lucideShoppingCart,
      lucideUser
    })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
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
