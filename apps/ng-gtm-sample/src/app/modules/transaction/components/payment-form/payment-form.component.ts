import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, InputTextModule, ButtonModule],
  template: `
    @if (checkoutFormManager.isShippingFormSubmitted$()) {
      <div class="container mx-auto p-4">
        <form [formGroup]="paymentForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="cardNum"
                class="block text-sm font-medium text-gray-700"
                >Card Number</label
              >
              <input
                pInputText
                formControlName="cardNum"
                id="cardNum"
                class="w-full"
              />
            </div>
            <div>
              <label
                for="expiration"
                class="block text-sm font-medium text-gray-700"
                >Expiration</label
              >
              <input
                pInputText
                formControlName="expiration"
                id="expiration"
                class="w-full"
              />
            </div>
            <div>
              <label
                for="security"
                class="block text-sm font-medium text-gray-700"
                >Security Code</label
              >
              <input
                pInputText
                formControlName="security"
                id="security"
                class="w-full"
              />
            </div>
          </div>
          <div class="mt-4">
            <button
              pButton
              type="button"
              label="Place Order"
              (click)="placeOrder()"
            ></button>
          </div>
        </form>
      </div>
    }
  `
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  constructor(
    public checkoutFormManager: CheckoutFormManagerService,
    private readonly navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    this.paymentForm = this.checkoutFormManager.paymentForm;
  }

  placeOrder() {
    this.checkoutFormManager.paymentFormComplete();
    this.navigationService.navigateToThankYou();
  }
}
