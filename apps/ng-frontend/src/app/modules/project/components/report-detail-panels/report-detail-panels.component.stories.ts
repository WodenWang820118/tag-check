import {
  applicationConfig,
  type Meta,
  type StoryObj
} from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { fn } from 'storybook/test';
import { EditableJsonPanelState } from '../report-detail.contracts';
import { ReportDetailPanelsViewComponent } from './report-detail-panels-view.component';

function createPanelState(
  title: string,
  overrides: Partial<EditableJsonPanelState> = {}
): EditableJsonPanelState {
  return {
    title,
    content: JSON.stringify(
      {
        event: 'purchase',
        currency: 'USD'
      },
      null,
      2
    ),
    loading: false,
    emptyMessage: `No ${title.toLowerCase()} found`,
    editMode: false,
    canSave: true,
    ...overrides
  };
}

const meta: Meta<ReportDetailPanelsViewComponent> = {
  component: ReportDetailPanelsViewComponent,
  title: 'Modules/Project/Components/ReportDetailPanelsViewComponent',
  decorators: [
    applicationConfig({
      providers: [provideAnimations()]
    })
  ],
  render: (args) => ({
    props: args,
    template: `
      <app-report-detail-panels-view
        [specPanel]="specPanel"
        [recordingPanel]="recordingPanel"
        [itemDefPanel]="itemDefPanel"
        [rawRequest]="rawRequest"
        [dataLayerContent]="dataLayerContent"
        (specToggleEdit)="specToggleEdit()"
        (specUploadRequested)="specUploadRequested($event)"
        (specSaveRequested)="specSaveRequested()"
        (specCancelRequested)="specCancelRequested()"
        (recordingToggleEdit)="recordingToggleEdit()"
        (recordingUploadRequested)="recordingUploadRequested($event)"
        (recordingSaveRequested)="recordingSaveRequested()"
        (recordingCancelRequested)="recordingCancelRequested()"
        (itemDefToggleEdit)="itemDefToggleEdit()"
        (itemDefUploadRequested)="itemDefUploadRequested($event)"
        (itemDefSaveRequested)="itemDefSaveRequested()"
        (itemDefCancelRequested)="itemDefCancelRequested()"
      >
        <div
          spec-editor
          class="rounded border border-dashed border-black/20 bg-black/[0.03] p-4 text-sm text-black/70"
        >
          Spec editor stub
        </div>
        <div
          recording-editor
          class="rounded border border-dashed border-black/20 bg-black/[0.03] p-4 text-sm text-black/70"
        >
          Recording editor stub
        </div>
        <div
          item-def-editor
          class="rounded border border-dashed border-black/20 bg-black/[0.03] p-4 text-sm text-black/70"
        >
          Item definition editor stub
        </div>
      </app-report-detail-panels-view>
    `
  }),
  args: {
    specPanel: createPanelState('Data Layer Spec'),
    recordingPanel: createPanelState('Chrome Recording', {
      content: JSON.stringify(
        { title: 'Purchase recording', steps: [] },
        null,
        2
      )
    }),
    itemDefPanel: createPanelState('Item Definition', {
      content: JSON.stringify({ item_name: 'Socks', item_id: 'sku-1' }, null, 2)
    }),
    rawRequest: 'POST /collect HTTP/1.1\ncontent-type: application/json',
    dataLayerContent: JSON.stringify(
      [
        {
          event: 'purchase',
          ecommerce: {
            value: 125
          }
        }
      ],
      null,
      2
    ),
    specToggleEdit: fn(),
    specUploadRequested: fn(),
    specSaveRequested: fn(),
    specCancelRequested: fn(),
    recordingToggleEdit: fn(),
    recordingUploadRequested: fn(),
    recordingSaveRequested: fn(),
    recordingCancelRequested: fn(),
    itemDefToggleEdit: fn(),
    itemDefUploadRequested: fn(),
    itemDefSaveRequested: fn(),
    itemDefCancelRequested: fn()
  }
};

export default meta;
type Story = StoryObj<ReportDetailPanelsViewComponent>;

export const Default: Story = {};

export const EditingItemDefinition: Story = {
  args: {
    itemDefPanel: createPanelState('Item Definition', {
      editMode: true
    })
  }
};
