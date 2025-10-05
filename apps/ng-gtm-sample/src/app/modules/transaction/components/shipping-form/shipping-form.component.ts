import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckoutFormManagerService } from '../../../../shared/services/checkout-form-manager/checkout-form-manager.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-shipping-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, InputTextModule, ButtonModule],
  template: `
    <div class="container mx-auto p-4">
      <form
        [formGroup]="shippingForm"
        (ngSubmit)="continue()"
        class="space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700"
              >Name:</label
            >
            <input pInputText formControlName="name" id="name" class="w-full" />
          </div>
          <div>
            <label for="address" class="block text-sm font-medium text-gray-700"
              >Address:</label
            >
            <input
              pInputText
              formControlName="address"
              id="address"
              class="w-full"
            />
          </div>
          <div>
            <label for="zip" class="block text-sm font-medium text-gray-700"
              >Zip Code:</label
            >
            <input pInputText formControlName="zip" id="zip" class="w-full" />
          </div>
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700"
              >City:</label
            >
            <input pInputText formControlName="city" id="city" class="w-full" />
          </div>
        </div>
        @if (!(checkoutFormManager.isShippingFormSubmitted())) {
        <div class="mt-4">
          <button pButton type="submit" label="Continue"></button>
        </div>
        }
      </form>
    </div>
  `,
})
export class ShippingFormComponent implements OnInit {
  shippingForm!: FormGroup;

  constructor(public checkoutFormManager: CheckoutFormManagerService) {}

  ngOnInit(): void {
    this.shippingForm = this.checkoutFormManager.shippingForm;
  }

  continue() {
    if (this.shippingForm.valid) {
      console.log('shipping form is valid');
      this.checkoutFormManager.shippingFormComplete();
    }
  }
}
