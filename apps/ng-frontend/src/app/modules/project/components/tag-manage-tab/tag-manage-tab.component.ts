import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { Parameter, TagSpec, TriggerConfig } from '@utils';
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
    const parameter = this.tagConfig$()?.parameter ?? [];
    const measurementIdOverride = parameter.find(
      (p) => p.key === 'measurementIdOverride'
    );
    return measurementIdOverride?.value ?? '';
  });

  // Google Tag reference name from the Event tag parameters (TAG_REFERENCE measurementId)
  googleTagName$ = computed(() => {
    const params = this.tagConfig$()?.parameter ?? [];
    const ref = params.find(
      (p) => p.key === 'measurementId' && p.type === 'TAG_REFERENCE'
    );
    return ref?.value ?? 'GoogleTag';
  });

  // Event name from the Event tag parameters or tagSpec fallback
  eventName$ = computed(() => {
    const params = this.tagConfig$()?.parameter ?? [];
    const nameParam = params.find(
      (p) => p.key === 'eventName' && p.type === 'TEMPLATE'
    );
    return (
      (nameParam?.value as string | undefined) ||
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
    const list = (listParam?.list ?? []) as Array<
      | { type: string; map: Parameter[] }
      | { type: string; value?: string; map?: Parameter[] }
    >;
    // Each item is a MAP with entries for 'parameter' and 'parameterValue'
    return list
      .map((item) => {
        const map: Parameter[] = (item?.map ?? []) as unknown as Parameter[];
        const paramName = map.find((m) => m.key === 'parameter')?.value as
          | string
          | undefined;
        const paramValue = map.find((m) => m.key === 'parameterValue')
          ?.value as string | undefined;
        if (!paramName || !paramValue) return undefined;
        return { parameter: paramName, value: paramValue } as EventParameter;
      })
      .filter((v): v is EventParameter => !!v);
  });
}
