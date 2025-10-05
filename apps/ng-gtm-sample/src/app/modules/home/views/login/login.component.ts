import { Component, effect, inject } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, ButtonModule],
  template: `
    <div class="flex justify-center items-center min-h-screen bg-gray-100">
      <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 class="text-2xl font-semibold text-center mb-4">Sign In</h2>
        <form [formGroup]="signInForm" (ngSubmit)="loginWithGoogle()">
          <div class="mb-4">
            <label for="username" class="block text-gray-700 mb-2"
              >Username</label
            >
            <input
              id="username"
              formControlName="username"
              type="text"
              placeholder="Enter username"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div class="mb-4">
            <label for="password" class="block text-gray-700 mb-2"
              >Password</label
            >
            <input
              id="password"
              formControlName="password"
              type="password"
              placeholder="Enter password"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
        </form>
        <div class="mt-4 text-center text-gray-500">or</div>
        <button
          pButton
          type="button"
          label="Sign in with Google"
          icon="pi pi-google"
          class="w-full mt-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
          (click)="loginWithGoogle()"
        ></button>
      </div>
    </div>
  `,
  styles: [``]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  signInForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  constructor(
    private readonly authService: AuthService,
    private readonly navigationService: NavigationService
  ) {
    effect(() => {
      const user = this.authService.getUser()();
      if (user) {
        this.navigationService.navigateToHome();
      }
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle().subscribe();
  }
}
