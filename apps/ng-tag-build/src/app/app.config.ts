import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SharedModule } from './shared.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(), // required
    provideHttpClient(), // required
    importProvidersFrom(SharedModule),
  ],
};
