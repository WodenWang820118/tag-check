import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { AuthenticationFormComponent } from './authentication-form.component';

import { provideHttpClient, withXhr } from '@angular/common/http';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { SettingsService } from '../../services/api/settings/settings.service';

const meta: Meta<AuthenticationFormComponent> = {
  component: AuthenticationFormComponent,
  title: 'Shared/Components/AuthenticationFormComponent',
  decorators: [
    moduleMetadata({
      imports: [
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        FormField
      ],
      providers: [SettingsService]
    }),
    applicationConfig({
      providers: [provideHttpClient(withXhr()), provideRouter(APP_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<AuthenticationFormComponent>;

export const Default: Story = {
  args: {}
};
