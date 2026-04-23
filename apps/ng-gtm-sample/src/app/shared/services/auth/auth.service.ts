import { catchError, defer, from, map, of } from 'rxjs';
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  NgZone,
  signal
} from '@angular/core';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import { FIREBASE_AUTH } from '../../../firebase/firebase.tokens';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly firebaseAuth = inject(FIREBASE_AUTH);
  private readonly destroyRef = inject(DestroyRef);
  private readonly user = signal<User | undefined>(undefined);
  private readonly user$ = computed(() => this.user());
  private readonly isLoggedIn$ = computed(() => Boolean(this.user()));

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly ngZone: NgZone
  ) {
    const unsubscribe = onAuthStateChanged(this.firebaseAuth, (user) => {
      this.ngZone.run(() => {
        this.user.set(user ?? undefined);
      });
    });

    this.destroyRef.onDestroy(unsubscribe);
  }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return defer(() =>
      from(signInWithPopup(this.firebaseAuth, provider))
    ).pipe(
      map((result) => {
        this.ngZone.run(() => {
          this.user.set(result.user);
        });
        this.analyticsService.trackEvent('login', { method: 'google' });
        return result.user;
      }),
      catchError((error) => {
        console.error('loginWithGoogle error', error);
        return of(undefined);
      })
    );
  }

  isLoggedIn() {
    return this.isLoggedIn$;
  }

  getUser() {
    return this.user$;
  }

  logout() {
    return defer(() =>
      from(signOut(this.firebaseAuth)).pipe(
        catchError((error) => {
          console.error('logout error', error);
          return of(undefined);
        })
      )
    );
  }
}
