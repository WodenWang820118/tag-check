import { Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { provideFirebaseApp } from '../../firebase/provide-firebase-app';
import { provideFirebaseAuthClient } from '../../firebase/provide-firebase-auth';
import { provideFirebaseDataClients } from '../../firebase/provide-firebase-data';
import { AuthService } from '../../shared/services/auth/auth.service';
import { CountriesDataService } from '../../shared/services/countries-data/countries-data.service';
import { FirebaseDestinationUploadService } from '../../shared/services/firebase-destination-upload/firebase-destination-upload.service';
import { FirebaseStorageService } from '../../shared/services/firebase-storage/firebase-storage.service';
import { FirestoreDestinationPipelineService } from '../../shared/services/firestore-destination-pipeline/firestore-destination-pipeline.service';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideFirebaseApp(environment.firebase),
      provideFirebaseAuthClient(),
      provideFirebaseDataClients(),
      AuthService,
      CountriesDataService,
      FirebaseDestinationUploadService,
      FirebaseStorageService,
      FirestoreDestinationPipelineService
    ],
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'dashboard',
        data: { seoKey: 'admin' },
        loadComponent: () =>
          import('./views/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'add-data',
        data: { seoKey: 'admin' },
        loadComponent: () =>
          import('./views/add-data/add-data.component').then(
            (m) => m.AddDataComponent
          )
      }
    ]
  }
];
