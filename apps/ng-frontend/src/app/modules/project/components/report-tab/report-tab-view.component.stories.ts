import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { fn } from 'storybook/test';
import { ReportTabViewComponent } from './report-tab-view.component';
import { ReportTabViewModel } from '../report-detail.contracts';

function createViewModel(
  overrides: Partial<ReportTabViewModel> = {}
): ReportTabViewModel {
  return {
    title: 'Purchase Report',
    createdAt: new Date('2026-04-23T12:34:56.000Z'),
    passed: false,
    eventName: 'purchase',
    message: 'The run failed because one required parameter was missing.',
    showHistory: true,
    showShareMenu: true,
    canExportSpreadsheet: true,
    canExportRecording: true,
    canExportEvent: true,
    hasMedia: true,
    videoBlob: new Blob(['video'], { type: 'video/webm' }),
    imageBlob: new Blob(['image'], { type: 'image/png' }),
    ...overrides
  };
}

const meta: Meta<ReportTabViewComponent> = {
  component: ReportTabViewComponent,
  title: 'Modules/Project/Components/ReportTabViewComponent',
  decorators: [
    applicationConfig({
      providers: [provideNoopAnimations()]
    })
  ],
  render: (args) => ({
    props: args,
    template: `
      <app-report-tab-view
        [viewModel]="viewModel"
        (copyEventName)="copyEventName()"
        (exportSpreadsheet)="exportSpreadsheet()"
        (exportRecording)="exportRecording()"
        (exportEvent)="exportEvent()"
        (openHistory)="openHistory()"
      >
        <div
          report-detail-content
          class="rounded border border-dashed border-black/20 bg-black/[0.03] p-4 text-sm text-black/70"
        >
          Report detail panels placeholder
        </div>
      </app-report-tab-view>
    `
  }),
  args: {
    viewModel: createViewModel(),
    copyEventName: fn(),
    exportSpreadsheet: fn(),
    exportRecording: fn(),
    exportEvent: fn(),
    openHistory: fn()
  }
};

export default meta;
type Story = StoryObj<ReportTabViewComponent>;

export const FailedWithMedia: Story = {};

export const PassedWithoutHistory: Story = {
  args: {
    viewModel: createViewModel({
      passed: true,
      message: 'The run completed successfully.',
      showHistory: false,
      showShareMenu: false
    })
  }
};

export const ActionsDisabled: Story = {
  args: {
    viewModel: createViewModel({
      canExportSpreadsheet: false,
      canExportRecording: false,
      canExportEvent: false,
      hasMedia: false,
      videoBlob: undefined,
      imageBlob: undefined
    })
  }
};
