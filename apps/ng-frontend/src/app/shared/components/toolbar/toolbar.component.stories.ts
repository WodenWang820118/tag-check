import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ToolbarComponent } from './toolbar.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { NgIf } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RouterLink, provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { MetadataSourceService } from '../../services/metadata-source/metadata-source.service';

const meta: Meta<ToolbarComponent> = {
  component: ToolbarComponent,
  title: 'Shared/Components/ToolbarComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        NgIf,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        RouterLink,
        MatMenuModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonToggleModule,
        MatInputModule,
      ],
      providers: [MetadataSourceService],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(APP_ROUTES),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<ToolbarComponent>;

export const Default: Story = {
  args: {},
};
