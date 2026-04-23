import { Component, effect } from '@angular/core';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-login',
  imports: [ButtonModule, CardModule, DividerModule],
  template: `
    <div class="grid min-h-[calc(100vh-9rem)] place-items-center py-10">
      <p-card
        styleClass="w-full max-w-xl rounded-[1.75rem] border border-slate-200 shadow-xl"
      >
        <ng-template pTemplate="header">
          <div class="rounded-t-[1.75rem] bg-slate-950 px-8 py-8 text-white">
            <div class="sample-eyebrow text-blue-200">
              <i class="pi pi-lock text-sm"></i>
              Admin Access
            </div>
            <h1 class="mt-4 text-3xl font-black tracking-tight">
              Sign in with Google to manage demo data.
            </h1>
            <p class="mt-3 max-w-lg text-sm leading-6 text-slate-200">
              The public storefront stays open, but the admin surface uses the
              Google sign-in flow that is already wired into this sample.
            </p>
          </div>
        </ng-template>

        <div class="space-y-6 px-2 py-2">
          <div class="sample-inset-surface px-5 py-4">
            <div
              class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400"
            >
              What this unlocks
            </div>
            <div class="mt-3 grid gap-3 text-sm text-slate-600">
              <div class="flex items-start gap-3">
                <i class="pi pi-database mt-0.5 text-blue-600"></i>
                <span>
                  Access the admin dashboard and the destination entry workflow.
                </span>
              </div>
              <div class="flex items-start gap-3">
                <i class="pi pi-images mt-0.5 text-blue-600"></i>
                <span>
                  Preview the Firebase-backed content flow used by the demo
                  site.
                </span>
              </div>
              <div class="flex items-start gap-3">
                <i class="pi pi-chart-line mt-0.5 text-blue-600"></i>
                <span>
                  Keep the GTM storefront behavior intact while testing admin
                  actions.
                </span>
              </div>
            </div>
          </div>

          <p-divider align="center" type="solid">
            <span
              class="bg-white px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400"
            >
              Auth Provider
            </span>
          </p-divider>

          <button
            pButton
            type="button"
            label="Continue with Google"
            icon="pi pi-google"
            class="w-full"
            (click)="loginWithGoogle()"
          ></button>
        </div>
      </p-card>
    </div>
  `
})
export class LoginComponent {
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
