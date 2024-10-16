import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { ReportBigTableComponent } from './report-big-table.component';

import { expect, fn, userEvent, within } from '@storybook/test';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { ReportTableToolbarComponent } from '../../components/report-table-toolbar/report-table-toolbar.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';

const meta: Meta<ReportBigTableComponent> = {
  component: ReportBigTableComponent,
  title: 'Modules/Project/Views/ReportBigTableComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [ReportTableComponent, ReportTableToolbarComponent],
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
type Story = StoryObj<ReportBigTableComponent>;

export const Default: Story = {
  args: {},
};

export const Searching: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttonToggle = await canvas.findByText('search');

    // Verify that the toggle exists
    expect(buttonToggle).toBeTruthy();
    buttonToggle.click();
  },
};
