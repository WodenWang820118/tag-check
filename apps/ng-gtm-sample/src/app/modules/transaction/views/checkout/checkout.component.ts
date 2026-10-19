import { CurrencyPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCreditCard } from '@ng-icons/lucide';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { ShippingFormComponent } from '../../components/shipping-form/shipping-form.component';
import { OrderService } from '../../../../shared/services/order/order.service';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [
    ShippingFormComponent,
    PaymentFormComponent,
    HlmTableImports,
    NgIcon,
    CurrencyPipe
  ],
  providers: [provideIcons({ lucideCreditCard })],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent {
  private readonly orderService = inject(OrderService);
  readonly orders$ = this.orderService.orders$;
  readonly totalPrice = this.orderService.calculateTotalPrice();
}
