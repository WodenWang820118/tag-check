import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { SnackBarComponent } from './snackbar.component';

import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';

const meta: Meta<SnackBarComponent> = {
  component: SnackBarComponent,
  title: 'Shared/Components/SnackBarComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [],
      providers: []
    }),
    applicationConfig({
      providers: [provideHttpClient(), provideRouter(APP_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<SnackBarComponent>;

export const Default: Story = {
  args: {}
};
