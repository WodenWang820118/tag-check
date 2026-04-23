import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, InputTextModule, ButtonModule],
  template: `
    @if (checkoutFormManager.isShippingFormSubmitted$()) {
      <div class="sample-panel p-6">
        <div class="mb-5 space-y-2">
          <div class="sample-eyebrow text-slate-400">
            <i class="pi pi-wallet text-sm"></i>
            Step 2
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-950">
            Payment details
          </h2>
          <p class="sample-copy">
            Completing this form simulates the
            <code>add_payment_info</code> event before the final thank-you page.
          </p>
        </div>

        <form [formGroup]="paymentForm" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2 md:col-span-2">
              <label for="cardNum" class="text-sm font-medium text-slate-600">
                Card Number
              </label>
              <input
                pInputText
                formControlName="cardNum"
                id="cardNum"
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <label
                for="expiration"
                class="text-sm font-medium text-slate-600"
              >
                Expiration
              </label>
              <input
                pInputText
                formControlName="expiration"
                id="expiration"
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <label for="security" class="text-sm font-medium text-slate-600">
                Security Code
              </label>
              <input
                pInputText
                formControlName="security"
                id="security"
                class="w-full"
              />
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              pButton
              type="button"
              label="Place Order"
              icon="pi pi-check"
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
    this.checkoutFormManager.completePurchase();
    this.navigationService.navigateToThankYou();
  }
}
