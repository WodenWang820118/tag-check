import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { AuthenticationFormComponent } from './authentication-form.component';

import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { SettingsService } from '../../services/api/settings/settings.service';

const meta: Meta<AuthenticationFormComponent> = {
  component: AuthenticationFormComponent,
  title: 'Shared/Components/AuthenticationFormComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [SettingsService]
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(APP_ROUTES)
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<AuthenticationFormComponent>;

export const Default: Story = {
  args: {}
};
