import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { ShippingFormComponent } from '../../components/shipping-form/shipping-form.component';
import { OrderService } from '../../../../shared/services/order/order.service';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [ShippingFormComponent, PaymentFormComponent, TableModule],
  templateUrl: './checkout.component.html',
  styles: [
    `
      #checkout h2 {
        color: steelblue;
        margin: 0 0 20px 0;
        padding: 0;
        border-bottom: 1px dashed;
        text-align: right;
        text-transform: lowercase;
        font-variant: small-caps;
      }

      #checkoutTable {
        width: 100%;
        border-collapse: collapse;
        color: steelblue;
        text-align: center !important;
        font-size: 16px;
        text-transform: lowercase;
        font-variant: small-caps;
      }

      #checkoutTable caption {
        font-size: 24px;
        padding: 0 0 6px 0;
        text-align: left;
        caption-side: top;
      }

      #checkoutTable th,
      td {
        border: 1px solid;
        text-align: center !important;
      }

      #checkoutTable th {
        color: steelblue;
        background: #e9e9e9;
        text-transform: lowercase;
        font-variant: small-caps;
      }

      #checkoutPrice {
        text-align: center;
        vertical-align: middle;
        font-weight: bold;
        background: #e9e9e9;
        color: steelblue;
      }

      #errareMSG {
        display: none;
      }

      #errareMSG p {
        color: red;
        font-weight: bold;
        font-size: 16px;
      }
    `
  ]
})
export class CheckoutComponent {
  private readonly orderService = inject(OrderService);
  orders$ = this.orderService.orders$;

  calculateTotalPrice() {
    return this.orderService.calculateTotalPrice();
  }
}
