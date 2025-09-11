import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { ReportTableComponent } from './report-table.component';

import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, provideRouter, RouterLink } from '@angular/router';
import { PROJECT_ROUTES } from '../../routes';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';
import { of } from 'rxjs';
import { IReportDetails } from '@utils';
// Using basic DOM APIs in the play function to avoid extra test utils imports

// Mock data matching the component expectations
const MOCK_REPORTS: IReportDetails[] = [
  {
    position: 0,
    event: 'purchase',
    eventId: 'evt-1',
    testName: 'Purchase Flow',
    eventName: 'purchase',
    passed: false,
    requestPassed: false,
    rawRequest: '',
    reformedDataLayer: [],
    destinationUrl: 'https://example.com',
    // Auditable
    createdAt: new Date(),
    updatedAt: new Date(),
    // Display-only convenience
    // @ts-expect-error Story-only property used by template
    hasRecording: true
  },
  {
    position: 1,
    event: 'signup',
    eventId: 'evt-2',
    testName: 'Signup Flow',
    eventName: 'signup',
    passed: true,
    requestPassed: true,
    rawRequest: '',
    reformedDataLayer: [],
    destinationUrl: 'https://example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    // @ts-expect-error Story-only property used by template
    hasRecording: true
  }
];

class MockTestRunningFacadeService {
  // Keep the same API shape used by the template (callable computed)
  isRunningTest$() {
    return false;
  }
  eventRunningTest$() {
    return '';
  }
  runTest(
    eventId: string,
    _projectSlug: string,
    ds: MatTableDataSource<IReportDetails>
  ) {
    // Simulate backend returning updated status for the given event
    const updated = ds.data.map((e) =>
      e.eventId === eventId
        ? { ...e, passed: true, requestPassed: true, updatedAt: new Date() }
        : e
    );
    ds.data = updated;
    return of(ds);
  }
}

const meta: Meta<ReportTableComponent> = {
  component: ReportTableComponent,
  title: 'Modules/Project/Components/ReportTableComponent',
  decorators: [
    moduleMetadata({
      //👇 Imports both components to allow component composition with Storybook
      imports: [
        AsyncPipe,
        DatePipe,
        NgClass,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        RouterLink,
        MatPaginatorModule,
        MatInputModule,
        MatCheckboxModule,
        MatBadgeModule,
        ProgressPieChartComponent
      ],
      providers: [
        {
          provide: TestRunningFacadeService,
          useClass: MockTestRunningFacadeService
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              projectSlug: 'storybook-project',
              projectReport: MOCK_REPORTS
            })
          }
        }
      ]
    }),
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideRouter(PROJECT_ROUTES)
      ]
    })
  ]
};
export default meta;
type Story = StoryObj<ReportTableComponent>;

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    // Ensure at least one failing icon is present initially
    const findText = (text: string) =>
      Array.from(canvasElement.querySelectorAll('*')).find(
        (el) => el.textContent?.trim() === text
      );

    // Wait until initial render is done
    let tries = 0;
    while (!findText('cancel') && tries < 20) {
      await new Promise((r) => setTimeout(r, 50));
      tries++;
    }
    if (!findText('cancel')) {
      throw new Error('Expected to find an initial failing icon (cancel)');
    }

    const runButtons = Array.from(
      canvasElement.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="run test"]'
      )
    );
    runButtons[0]?.click();

    // After clicking run, a passing icon should appear
    tries = 0;
    while (!findText('check_circle') && tries < 40) {
      await new Promise((r) => setTimeout(r, 50));
      tries++;
    }
    if (!findText('check_circle')) {
      throw new Error(
        'Expected to find a passing icon (check_circle) after running the test'
      );
    }
  }
};
