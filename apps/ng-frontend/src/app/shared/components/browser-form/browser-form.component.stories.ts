import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { BrowserFormComponent } from './browser-form.component';

import { provideHttpClient, withXhr } from '@angular/common/http';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { SettingsService } from '../../services/api/settings/settings.service';

const meta: Meta<BrowserFormComponent> = {
  component: BrowserFormComponent,
  title: 'Shared/Components/BrowserFormComponent',
  decorators: [
    moduleMetadata({
      imports: [
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
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
type Story = StoryObj<BrowserFormComponent>;

export const Default: Story = {
  args: {}
};
