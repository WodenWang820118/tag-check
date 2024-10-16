import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { DetailViewComponent } from './detail-view.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, RouterLink } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { AsyncPipe, NgIf, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CarouselComponent } from '../../../../shared/components/carousel/carousel.component';
import { BlobToUrlPipe } from '../../../../shared/pipes/blob-to-url-pipe';
import { ImageService } from '../../../../shared/services/api/image/image.service';
import { VideosService } from '../../../../shared/services/api/videos/videos.service';
import { ReportDetailsService } from '../../../../shared/services/report-details/report-details.service';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';

const meta: Meta<DetailViewComponent> = {
  component: DetailViewComponent,
  title: 'Modules/Project/Views/DetailViewComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        NgIf,
        ReportDetailPanelsComponent,
        BlobToUrlPipe,
        MatIconModule,
        MatButtonModule,
        CarouselComponent,
        DatePipe,
        RouterLink,
      ],
      providers: [ReportDetailsService, ImageService, VideosService],
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
type Story = StoryObj<DetailViewComponent>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/detail-view works!/gi)).toBeTruthy();
  },
};
