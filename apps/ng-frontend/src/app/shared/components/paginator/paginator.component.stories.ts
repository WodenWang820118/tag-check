import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { PaginatorComponent } from './paginator.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';
import { StylePaginatorDirective } from '../../directives/style-paginator.directive';

const meta: Meta<PaginatorComponent> = {
  component: PaginatorComponent,
  title: 'PaginatorComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        MatButtonModule,
        MatPaginatorModule,
        StylePaginatorDirective,
        MatIconModule,
      ],
      providers: [],
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
type Story = StoryObj<PaginatorComponent>;

export const Primary: Story = {
  args: {
    pageSize: 0,
    pageSizeOptions: [5, 10, 25, 100],
  },
};

export const Heading: Story = {
  args: {
    pageSize: 0,
    pageSizeOptions: [5, 10, 25, 100],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/paginator works!/gi)).toBeTruthy();
  },
};