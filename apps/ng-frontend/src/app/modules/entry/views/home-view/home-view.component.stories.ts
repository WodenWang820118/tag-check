import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { HomeViewComponent } from './home-view.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ENTRY_ROUTES } from '../../routes';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

const meta: Meta<HomeViewComponent> = {
  component: HomeViewComponent,
  title: 'Modules/Entry/Views/HomeViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [ProjectListComponent],
      providers: []
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(ENTRY_ROUTES)
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<HomeViewComponent>;

export const Default: Story = {
  args: {}
};
