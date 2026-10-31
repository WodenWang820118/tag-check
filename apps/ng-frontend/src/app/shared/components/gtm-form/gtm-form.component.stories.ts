import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { GtmFormComponent } from './gtm-form.component';

import { CommonModule } from '@angular/common';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { SettingsService } from '../../services/api/settings/settings.service';

const meta: Meta<GtmFormComponent> = {
  component: GtmFormComponent,
  title: 'Shared/Components/GtmFormComponent',
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatCheckboxModule,
        MatTooltipModule,
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
type Story = StoryObj<GtmFormComponent>;

export const Default: Story = {
  args: {}
};
