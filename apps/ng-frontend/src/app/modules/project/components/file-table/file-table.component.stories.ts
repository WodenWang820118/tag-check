import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { FileTableComponent } from './file-table.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { DatePipe, NgClass } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { FileTableDataSourceFacadeService } from '../../../../shared/services/facade/file-table-data-source-facade.service';
import { PROJECT_ROUTES } from '../../routes';

const meta: Meta<FileTableComponent> = {
  component: FileTableComponent,
  title: 'Modules/Project/Components/FileTableComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        MatTableModule,
        MatIconModule,
        MatPaginatorModule,
        MatCheckboxModule,
        DatePipe,
        MatInputModule,
        NgClass,
        MatSortModule,
      ],
      providers: [FileTableDataSourceFacadeService],
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
type Story = StoryObj<FileTableComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/file-table works!/gi)).toBeTruthy();
  },
};
