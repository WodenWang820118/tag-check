import { Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { provideFirebaseApp } from '../../firebase/provide-firebase-app';
import { provideFirebaseAuthClient } from '../../firebase/provide-firebase-auth';
import { AuthService } from '../../shared/services/auth/auth.service';

export const HOME_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'login',
        data: { seoKey: 'login' },
        providers: [
          provideFirebaseApp(environment.firebase),
          provideFirebaseAuthClient(),
          AuthService
        ],
        loadComponent: () =>
          import('./views/login/login.component').then((m) => m.LoginComponent)
      },
      {
        path: '',
        data: { seoKey: 'home' },
        loadComponent: () =>
          import('./views/main/main.component').then((m) => m.MainComponent)
      }
    ]
  }
] as Routes;
