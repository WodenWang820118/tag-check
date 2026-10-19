import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { OrderService } from '../../services/order/order.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartColumn,
  lucideCompass,
  lucideHouse,
  lucideLogOut,
  lucideMap,
  lucidePlus,
  lucideShoppingCart,
  lucideUser
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [RouterModule, HlmButton, NgIcon],
  providers: [
    provideIcons({
      lucideChartColumn,
      lucideCompass,
      lucideHouse,
      lucideLogOut,
      lucideMap,
      lucidePlus,
      lucideShoppingCart,
      lucideUser
    })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
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
