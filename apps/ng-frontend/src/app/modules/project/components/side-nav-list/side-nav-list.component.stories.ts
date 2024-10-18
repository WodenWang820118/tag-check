import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { SideNavListComponent } from './side-nav-list.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { NgClass, NgIf } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RouterLink, RouterLinkActive, provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayComponent } from '../overlay/overlay.component';

const meta: Meta<SideNavListComponent> = {
  component: SideNavListComponent,
  title: 'Modules/Project/Components/SideNavListComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        NgIf,
        MatListModule,
        MatIconModule,
        RouterLink,
        MatMenuModule,
        OverlayModule,
        OverlayComponent,
        MatButtonModule,
        RouterLinkActive,
        NgClass,
      ],
      providers: [],
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(PROJECT_ROUTES),
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<SideNavListComponent>;

export const Default: Story = {
  args: {},
};
