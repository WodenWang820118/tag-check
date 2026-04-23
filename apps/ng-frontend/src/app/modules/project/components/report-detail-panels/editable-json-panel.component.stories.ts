import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { fn } from 'storybook/test';
import { EditableJsonPanelState } from '../report-detail.contracts';
import { EditableJsonPanelComponent } from './editable-json-panel.component';

function createState(
  overrides: Partial<EditableJsonPanelState> = {}
): EditableJsonPanelState {
  return {
    title: 'Data Layer Spec',
    content: JSON.stringify({ event: 'purchase' }, null, 2),
    loading: false,
    emptyMessage: 'No Spec found',
    editMode: false,
    canSave: true,
    ...overrides
  };
}

const meta: Meta<EditableJsonPanelComponent> = {
  component: EditableJsonPanelComponent,
  title: 'Modules/Project/Components/EditableJsonPanelComponent',
  decorators: [
    applicationConfig({
      providers: [provideNoopAnimations()]
    })
  ],
  render: (args) => ({
    props: args,
    template: `
      <app-editable-json-panel
        [state]="state"
        (toggleEdit)="toggleEdit()"
        (uploadRequested)="uploadRequested($event)"
        (saveRequested)="saveRequested()"
        (cancelRequested)="cancelRequested()"
      >
        <div
          editor
          class="rounded border border-dashed border-black/20 bg-black/[0.03] p-4 text-sm text-black/70"
        >
          Editor stub
        </div>
      </app-editable-json-panel>
    `
  }),
  args: {
    state: createState(),
    toggleEdit: fn(),
    uploadRequested: fn(),
    saveRequested: fn(),
    cancelRequested: fn()
  }
};

export default meta;
type Story = StoryObj<EditableJsonPanelComponent>;

export const ReadOnly: Story = {};

export const Loading: Story = {
  args: {
    state: createState({
      loading: true
    })
  }
};

export const Empty: Story = {
  args: {
    state: createState({
      content: null
    })
  }
};

export const Editing: Story = {
  args: {
    state: createState({
      editMode: true
    })
  }
};

export const SaveDisabled: Story = {
  args: {
    state: createState({
      editMode: true,
      canSave: false
    })
  }
};
