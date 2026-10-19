import { CurrencyPipe } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideInfo,
  lucidePencil,
  lucideShoppingCart,
  lucideTrash2
} from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AnalyticsService } from '../../../../shared/services/analytics/analytics.service';
import { OrderService } from '../../../../shared/services/order/order.service';
import { Order } from '../../../../shared/models/order.model';
import { WindowSizeService } from '../../../../shared/services/window-size/window-size.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-basket',
  imports: [
    HlmAlertImports,
    HlmButton,
    HlmCard,
    HlmTableImports,
    NgIcon,
    CurrencyPipe
  ],
  providers: [
    provideIcons({
      lucideArrowRight,
      lucideInfo,
      lucidePencil,
      lucideShoppingCart,
      lucideTrash2
    })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './basket.component.html'
})
export class BasketComponent implements OnInit {
  public readonly orderService = inject(OrderService);
  readonly basketItems$ = this.orderService.orders$;
  readonly cartTotal = this.orderService.calculateTotalPrice();

  constructor(
    public readonly windowSizeService: WindowSizeService,
    private readonly analyticsService: AnalyticsService,
    private readonly navigationService: NavigationService
  ) {}

  ngOnInit() {
    const orders = this.orderService.orders$();
    if (orders.length > 0) {
      this.analyticsService.trackEvent('view_cart', orders);
    }
  }

  navigateToBeginCheckout() {
    this.navigationService.navigateToCheckout();
  }

  updateCart(orderId: string) {
    this.navigationService.navigateToDetail(orderId);
  }

  removeFromCart(order: Order): void {
    this.orderService.removeFromCart(order);
  }

  beginCheckout() {
    this.orderService.beginCheckout();
  }
}
