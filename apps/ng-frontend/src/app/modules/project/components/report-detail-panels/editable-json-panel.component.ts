import { Component, input, output } from '@angular/core';
import {
  MatExpansionModule,
  MatExpansionPanel
} from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditableJsonPanelState } from '../report-detail.contracts';

@Component({
  selector: 'app-editable-json-panel',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <mat-expansion-panel #panel hideToggle>
      <mat-expansion-panel-header class="headers-align">
        <mat-panel-title>{{ state().title }}</mat-panel-title>
        <mat-panel-description>
          @if (!state().editMode) {
            <button
              mat-mini-fab
              color="primary"
              class="edit"
              type="button"
              (click)="openEditor(panel, $event)"
            >
              <mat-icon class="icon-contrast" matTooltip="Edit">edit</mat-icon>
            </button>
          }
        </mat-panel-description>
      </mat-expansion-panel-header>

      <mat-panel-description>
        @if (state().loading) {
          <div class="loading-spinner">
            <mat-progress-spinner
              [mode]="'indeterminate'"
            ></mat-progress-spinner>
          </div>
        } @else if (!state().content) {
          <p>{{ state().emptyMessage }}</p>
        } @else if (!state().editMode) {
          <pre class="json">{{ state().content }}</pre>
        } @else {
          <ng-content select="[editor]"></ng-content>
        }
      </mat-panel-description>

      @if (state().editMode) {
        <mat-action-row>
          <button
            mat-raised-button
            color="primary"
            type="button"
            (click)="fileInput.click()"
          >
            Upload
          </button>
          <input
            hidden
            #fileInput
            type="file"
            (change)="uploadRequested.emit($event)"
          />
          <button
            mat-raised-button
            color="primary"
            type="button"
            [disabled]="!state().canSave"
            (click)="saveRequested.emit()"
          >
            Save
          </button>
          <button
            mat-raised-button
            class="remark"
            type="button"
            (click)="cancelEditor(panel, $event)"
          >
            Cancel
          </button>
        </mat-action-row>
      }
    </mat-expansion-panel>
  `,
  styleUrls: ['./editable-json-panel.component.scss']
})
export class EditableJsonPanelComponent {
  state = input.required<EditableJsonPanelState>();

  toggleEdit = output<void>();
  uploadRequested = output<Event>();
  saveRequested = output<void>();
  cancelRequested = output<void>();

  openEditor(panel: MatExpansionPanel, event: Event) {
    event.stopPropagation();

    try {
      const current = event.currentTarget as HTMLElement | null;
      const host = current?.closest('.mat-expansion-panel');
      host?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      /* ignore DOM errors */
    }

    panel.open();
    this.toggleEdit.emit();
  }

  cancelEditor(panel: MatExpansionPanel, event: Event) {
    event.stopPropagation();
    panel.close();
    this.cancelRequested.emit();
  }
}
