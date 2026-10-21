import {
  Component,
  computed,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import {
  TagSpec,
  TriggerConfig,
  VariableConfig,
  VariableReferenceValue,
  getGa4EventParameterRows,
  getParameterValue,
  resolveVariableReference
} from '@utils';
import { MatButtonModule } from '@angular/material/button';

export interface EventParameter {
  parameter: string;
  value: string;
  /** What the value's variable stands for, when the container says. */
  resolved: string | null;
}

function describeReference(value: VariableReferenceValue | null) {
  if (!value) return null;
  return value.kind === 'constant'
    ? `Constant: ${value.value}`
    : `Data layer: ${value.path}`;
}

@Component({
  selector: 'app-tag-manage-tab',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatDividerModule,
    MatButtonModule
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './tag-manage-tab.component.html'
  // No styleUrls needed anymore
})
export class TagManageTabComponent {
  // Inputs
  tagSpec = input<TagSpec | undefined>(undefined);
  /** The container's variables, to resolve the tag's {{references}}. */
  variables = input<readonly VariableConfig[]>([]);

  // Display columns
  displayedColumns: string[] = ['parameter', 'value'];

  // Computed helpers
  private readonly tagConfig$ = computed(() => this.tagSpec()?.rawGtmTag?.tag);

  /** The tag's Measurement ID field, often a {{Constant}} reference. */
  measurementIdReference$ = computed(
    () =>
      getParameterValue(
        this.tagConfig$()?.parameter,
        'measurementIdOverride'
      ) ?? ''
  );

  /** The Measurement ID itself when the field references a Constant. */
  measurementId$ = computed(() => {
    const reference = this.measurementIdReference$();
    const resolved = resolveVariableReference(reference, this.variables());
    return resolved?.kind === 'constant' ? resolved.value : reference;
  });

  // Google Tag reference name from the Event tag parameters (TAG_REFERENCE measurementId)
  googleTagName$ = computed(() => {
    return (
      getParameterValue(
        this.tagConfig$()?.parameter,
        'measurementId',
        'TAG_REFERENCE'
      ) ?? 'GoogleTag'
    );
  });

  // Event name from the Event tag parameters or tagSpec fallback
  eventName$ = computed(() => {
    return (
      getParameterValue(
        this.tagConfig$()?.parameter,
        'eventName',
        'TEMPLATE'
      ) ||
      this.tagSpec()?.eventName ||
      this.tagSpec()?.event ||
      ''
    );
  });

  // Friendly firing option text
  firingOption$ = computed(() => {
    const opt = this.tagConfig$()?.tagFiringOption;
    switch (opt) {
      case 'ONCE_PER_EVENT':
        return 'Once per event';
      case 'ONCE_PER_PAGE':
        return 'Once per page';
      case 'UNLIMITED':
        return 'Unlimited';
      default:
        return 'Once per event';
    }
  });

  // Trigger details (display the first trigger name and type if available)
  triggerName$ = computed(() => {
    const triggers: TriggerConfig[] = this.tagSpec()?.rawGtmTag?.trigger ?? [];
    return triggers[0]?.name ?? `event equals ${this.eventName$()}`;
  });
  triggerType$ = computed(() => 'Custom Event');

  /**
   * The parameters the tag sends: its own table, then the table of the Event
   * Settings variable it references once the container's variables load.
   */
  eventParameters$ = computed<EventParameter[]>(() => {
    const tag = this.tagConfig$();
    if (!tag?.parameter) return [];
    const variables = this.variables();
    return getGa4EventParameterRows(tag, variables).map((row) => ({
      ...row,
      resolved: describeReference(
        resolveVariableReference(row.value, variables)
      )
    }));
  });
}
