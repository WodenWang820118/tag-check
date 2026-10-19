import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTruck } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';

@Component({
  selector: 'app-shipping-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    NgIcon
  ],
  providers: [provideIcons({ lucideTruck })],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="sample-panel p-6">
      <div class="mb-5 space-y-2">
        <div class="sample-eyebrow text-slate-400">
          <ng-icon name="lucideTruck" class="text-sm" />
          Step 1
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-950">
          Shipping details
        </h2>
        <p class="sample-copy">
          Collect the address information used to simulate the
          <code>add_shipping_info</code> event.
        </p>
      </div>

      <form
        [formGroup]="shippingForm"
        (ngSubmit)="continue()"
        class="space-y-4"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label
              hlmLabel
              for="name"
              class="text-sm font-medium text-slate-600"
            >
              Name
            </label>
            <input
              hlmInput
              formControlName="name"
              id="name"
              class="w-full bg-white"
              data-testid="shipping-name"
            />
          </div>
          <div class="space-y-2">
            <label
              hlmLabel
              for="address"
              class="text-sm font-medium text-slate-600"
            >
              Address
            </label>
            <input
              hlmInput
              formControlName="address"
              id="address"
              class="w-full bg-white"
              data-testid="shipping-address"
            />
          </div>
          <div class="space-y-2">
            <label
              hlmLabel
              for="zip"
              class="text-sm font-medium text-slate-600"
            >
              Zip Code
            </label>
            <input
              hlmInput
              formControlName="zip"
              id="zip"
              class="w-full bg-white"
              data-testid="shipping-zip"
            />
          </div>
          <div class="space-y-2">
            <label
              hlmLabel
              for="city"
              class="text-sm font-medium text-slate-600"
            >
              City
            </label>
            <input
              hlmInput
              formControlName="city"
              id="city"
              class="w-full bg-white"
              data-testid="shipping-city"
            />
          </div>
        </div>

        @if (!checkoutFormManager.isShippingFormSubmitted()) {
          <div class="flex justify-end pt-2">
            <button hlmBtn type="submit" data-testid="shipping-continue">
              Continue
            </button>
          </div>
        }
      </form>
    </div>
  `
})
export class ShippingFormComponent implements OnInit {
  shippingForm!: FormGroup;

  constructor(public checkoutFormManager: CheckoutFormManagerService) {}

  ngOnInit(): void {
    this.shippingForm = this.checkoutFormManager.shippingForm;
  }

  continue() {
    if (this.shippingForm.valid) {
      this.checkoutFormManager.shippingFormComplete();
    }
  }
}
