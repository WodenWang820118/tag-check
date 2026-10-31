import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideWallet } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    FormField,
    HlmButton,
    HlmInput,
    HlmLabel,
    NgIcon
  ],
  providers: [provideIcons({ lucideCheck, lucideWallet })],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (checkoutFormManager.isShippingFormSubmitted$()) {
      <div class="sample-panel p-6">
        <div class="mb-5 space-y-2">
          <div class="sample-eyebrow text-slate-400">
            <ng-icon name="lucideWallet" class="text-sm" />
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

        <form class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2 md:col-span-2">
              <label
                hlmLabel
                for="cardNum"
                class="text-sm font-medium text-slate-600"
              >
                Card Number
              </label>
              <input
                hlmInput
                [formField]="paymentForm.cardNum"
                id="cardNum"
                class="w-full bg-white"
                data-testid="payment-cardNum"
              />
            </div>
            <div class="space-y-2">
              <label
                hlmLabel
                for="expiration"
                class="text-sm font-medium text-slate-600"
              >
                Expiration
              </label>
              <input
                hlmInput
                [formField]="paymentForm.expiration"
                id="expiration"
                class="w-full bg-white"
                data-testid="payment-expiration"
              />
            </div>
            <div class="space-y-2">
              <label
                hlmLabel
                for="security"
                class="text-sm font-medium text-slate-600"
              >
                Security Code
              </label>
              <input
                hlmInput
                [formField]="paymentForm.security"
                id="security"
                class="w-full bg-white"
                data-testid="payment-security"
              />
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              hlmBtn
              type="button"
              data-testid="place-order"
              (click)="placeOrder()"
            >
              <ng-icon name="lucideCheck" />
              Place Order
            </button>
          </div>
        </form>
      </div>
    }
  `
})
export class PaymentFormComponent {
  public readonly checkoutFormManager = inject(CheckoutFormManagerService);
  private readonly navigationService = inject(NavigationService);
  readonly paymentForm = this.checkoutFormManager.paymentForm;

  placeOrder() {
    this.checkoutFormManager.paymentFormComplete();
    this.checkoutFormManager.completePurchase();
    this.navigationService.navigateToThankYou();
  }
}
