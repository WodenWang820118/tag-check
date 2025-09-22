import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { OverlayComponent } from './overlay.component';

import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { OverlayModule } from '@angular/cdk/overlay';

const meta: Meta<OverlayComponent> = {
  component: OverlayComponent,
  title: 'Modules/Project/Components/OverlayComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [OverlayModule],
      providers: []
    }),
    applicationConfig({
      providers: [provideHttpClient(), provideRouter(PROJECT_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<OverlayComponent>;

export const Default: Story = {
  args: {
    isOpen: false
  }
};
