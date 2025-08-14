import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { PaginatorComponent } from './paginator.component';

import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';

const meta: Meta<PaginatorComponent> = {
  component: PaginatorComponent,
  title: 'Shared/Components/PaginatorComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [MatButtonModule, MatPaginatorModule, MatIconModule],
      providers: []
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
type Story = StoryObj<PaginatorComponent>;

export const Default: Story = {
  args: {}
};
