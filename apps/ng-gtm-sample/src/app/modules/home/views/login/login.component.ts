import { Component, effect, ChangeDetectionStrategy } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartLine,
  lucideDatabase,
  lucideImages,
  lucideLock
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard } from '@spartan-ng/helm/card';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { AuthService } from '../../../../shared/services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-login',
  imports: [HlmButton, HlmCard, HlmSeparator, NgIcon],
  providers: [
    provideIcons({ lucideChartLine, lucideDatabase, lucideImages, lucideLock })
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="grid min-h-[calc(100vh-9rem)] place-items-center py-10">
      <section
        hlmCard
        class="w-full max-w-xl gap-0 rounded-[1.75rem] pt-0 text-base shadow-xl"
      >
        <div class="rounded-t-[1.75rem] bg-slate-950 px-8 py-8 text-white">
          <div class="sample-eyebrow text-blue-200">
            <ng-icon name="lucideLock" class="text-sm" />
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

        <div class="space-y-6 px-8 pt-6">
          <div class="sample-inset-surface px-5 py-4">
            <div
              class="text-sm font-semibold tracking-[0.24em] text-slate-400 uppercase"
            >
              What this unlocks
            </div>
            <div class="mt-3 grid gap-3 text-sm text-slate-600">
              <div class="flex items-start gap-3">
                <ng-icon name="lucideDatabase" class="mt-0.5 text-blue-600" />
                <span>
                  Access the admin dashboard and the destination entry workflow.
                </span>
              </div>
              <div class="flex items-start gap-3">
                <ng-icon name="lucideImages" class="mt-0.5 text-blue-600" />
                <span>
                  Preview the Firebase-backed content flow used by the demo
                  site.
                </span>
              </div>
              <div class="flex items-start gap-3">
                <ng-icon name="lucideChartLine" class="mt-0.5 text-blue-600" />
                <span>
                  Keep the GTM storefront behavior intact while testing admin
                  actions.
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <hlm-separator class="flex-1" />
            <span
              class="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase"
            >
              Auth Provider
            </span>
            <hlm-separator class="flex-1" />
          </div>

          <button
            hlmBtn
            type="button"
            class="w-full"
            data-testid="login-google"
            (click)="loginWithGoogle()"
          >
            <svg viewBox="0 0 24 24" class="size-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1H12v2.98h5.35c-.23 1.43-1.65 4.2-5.35 4.2a5.9 5.9 0 0 1 0-11.8c1.84 0 3.07.78 3.78 1.46l2.58-2.49C16.72 3.92 14.6 3 12 3a9 9 0 1 0 0 18c5.2 0 8.64-3.65 8.64-8.8 0-.59-.06-1.04-.14-1.48Z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </section>
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
        this.navigationService.navigateToAdmin();
      }
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle().subscribe();
  }
}
