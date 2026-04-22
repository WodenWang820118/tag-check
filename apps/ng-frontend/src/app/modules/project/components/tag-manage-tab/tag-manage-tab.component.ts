import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import {
  Parameter,
  TagSpec,
  TriggerConfig,
  getParameterListItems,
  getParameterMapValue,
  getParameterValue
} from '@utils';
import { MatButtonModule } from '@angular/material/button';

export interface EventParameter {
  parameter: string;
  value: string;
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
  templateUrl: './tag-manage-tab.component.html'
  // No styleUrls needed anymore
})
export class TagManageTabComponent {
  // Inputs
  tagSpec = input<TagSpec | undefined>(undefined);

  // Display columns
  displayedColumns: string[] = ['parameter', 'value'];

  // Computed helpers
  private readonly tagConfig$ = computed(() => {
    console.log('tag info: ', this.tagSpec()?.rawGtmTag?.tag);
    return this.tagSpec()?.rawGtmTag?.tag;
  });

  // Measurement ID: show standard template used by GoogleTag generator
  measurementId$ = computed(() => {
    return (
      getParameterValue(
        this.tagConfig$()?.parameter,
        'measurementIdOverride'
      ) ?? ''
    );
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

  // Event parameters table data from LIST(eventParameters)
  eventParameters$ = computed<EventParameter[]>(() => {
    const params: Parameter[] = this.tagConfig$()?.parameter ?? [];
    const listParam = params.find(
      (p) => p.key === 'eventSettingsTable' && p.type === 'LIST'
    );
    return getParameterListItems(listParam)
      .map((item) => {
        const paramName = getParameterMapValue(item, 'parameter');
        const paramValue = getParameterMapValue(item, 'parameterValue');
        if (!paramName || !paramValue) return undefined;
        return { parameter: paramName, value: paramValue } as EventParameter;
      })
      .filter((v): v is EventParameter => !!v);
  });
}
