import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { ShippingFormComponent } from '../../components/shipping-form/shipping-form.component';
import { OrderService } from '../../../../shared/services/order/order.service';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [
    ShippingFormComponent,
    PaymentFormComponent,
    TableModule,
    CurrencyPipe
  ],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent {
  private readonly orderService = inject(OrderService);
  readonly orders$ = this.orderService.orders$;
  readonly totalPrice = this.orderService.calculateTotalPrice();
}
