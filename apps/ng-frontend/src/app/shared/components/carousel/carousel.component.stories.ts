import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { CarouselComponent } from './carousel.component';

import { AsyncPipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';

const meta: Meta<CarouselComponent> = {
  component: CarouselComponent,
  title: 'Shared/Components/CarouselComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [AsyncPipe],
      providers: []
    }),
    applicationConfig({
      providers: [provideHttpClient(), provideRouter(APP_ROUTES)]
    })
  ]
};
export default meta;
type Story = StoryObj<CarouselComponent>;

export const Default: Story = {
  args: {}
};
