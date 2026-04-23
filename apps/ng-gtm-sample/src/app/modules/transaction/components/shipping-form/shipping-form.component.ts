import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';

@Component({
  selector: 'app-shipping-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, InputTextModule, ButtonModule],
  template: `
    <div class="sample-panel p-6">
      <div class="mb-5 space-y-2">
        <div class="sample-eyebrow text-slate-400">
          <i class="pi pi-truck text-sm"></i>
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
            <label for="name" class="text-sm font-medium text-slate-600">
              Name
            </label>
            <input pInputText formControlName="name" id="name" class="w-full" />
          </div>
          <div class="space-y-2">
            <label for="address" class="text-sm font-medium text-slate-600">
              Address
            </label>
            <input
              pInputText
              formControlName="address"
              id="address"
              class="w-full"
            />
          </div>
          <div class="space-y-2">
            <label for="zip" class="text-sm font-medium text-slate-600">
              Zip Code
            </label>
            <input pInputText formControlName="zip" id="zip" class="w-full" />
          </div>
          <div class="space-y-2">
            <label for="city" class="text-sm font-medium text-slate-600">
              City
            </label>
            <input pInputText formControlName="city" id="city" class="w-full" />
          </div>
        </div>

        @if (!checkoutFormManager.isShippingFormSubmitted()) {
          <div class="flex justify-end pt-2">
            <button pButton type="submit" label="Continue"></button>
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
