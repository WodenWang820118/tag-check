import { Component, input, output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { EditableJsonPanelState } from '../report-detail.contracts';
import { EditableJsonPanelComponent } from './editable-json-panel.component';

@Component({
  selector: 'app-report-detail-panels-view',
  standalone: true,
  imports: [MatExpansionModule, EditableJsonPanelComponent],
  template: `
    <div class="test-detail-panels">
      <mat-accordion class="headers-align" multi>
        <app-editable-json-panel
          [state]="specPanel()"
          (toggleEdit)="specToggleEdit.emit()"
          (uploadRequested)="specUploadRequested.emit($event)"
          (saveRequested)="specSaveRequested.emit()"
          (cancelRequested)="specCancelRequested.emit()"
        >
          <div editor>
            <ng-content select="[spec-editor]"></ng-content>
          </div>
        </app-editable-json-panel>

        <app-editable-json-panel
          [state]="recordingPanel()"
          (toggleEdit)="recordingToggleEdit.emit()"
          (uploadRequested)="recordingUploadRequested.emit($event)"
          (saveRequested)="recordingSaveRequested.emit()"
          (cancelRequested)="recordingCancelRequested.emit()"
        >
          <div editor>
            <ng-content select="[recording-editor]"></ng-content>
          </div>
        </app-editable-json-panel>

        <mat-expansion-panel hideToggle>
          <mat-expansion-panel-header>
            <mat-panel-title>Raw Request</mat-panel-title>
          </mat-expansion-panel-header>
          <mat-panel-description>
            <div class="raw-request-container">
              <pre class="raw-request" aria-label="Raw Request">
{{ rawRequest() }}
              </pre>
            </div>
          </mat-panel-description>
        </mat-expansion-panel>

        <mat-expansion-panel hideToggle>
          <mat-expansion-panel-header>
            <mat-panel-title>Data Layer</mat-panel-title>
          </mat-expansion-panel-header>
          <mat-panel-description>
            <pre class="json">{{ dataLayerContent() }}</pre>
          </mat-panel-description>
        </mat-expansion-panel>

        <app-editable-json-panel
          [state]="itemDefPanel()"
          (toggleEdit)="itemDefToggleEdit.emit()"
          (uploadRequested)="itemDefUploadRequested.emit($event)"
          (saveRequested)="itemDefSaveRequested.emit()"
          (cancelRequested)="itemDefCancelRequested.emit()"
        >
          <div editor>
            <ng-content select="[item-def-editor]"></ng-content>
          </div>
        </app-editable-json-panel>
      </mat-accordion>
    </div>
  `,
  styleUrls: ['./report-detail-panels-view.component.scss']
})
export class ReportDetailPanelsViewComponent {
  specPanel = input.required<EditableJsonPanelState>();
  recordingPanel = input.required<EditableJsonPanelState>();
  itemDefPanel = input.required<EditableJsonPanelState>();
  rawRequest = input('');
  dataLayerContent = input('');

  specToggleEdit = output<void>();
  specUploadRequested = output<Event>();
  specSaveRequested = output<void>();
  specCancelRequested = output<void>();

  recordingToggleEdit = output<void>();
  recordingUploadRequested = output<Event>();
  recordingSaveRequested = output<void>();
  recordingCancelRequested = output<void>();

  itemDefToggleEdit = output<void>();
  itemDefUploadRequested = output<Event>();
  itemDefSaveRequested = output<void>();
  itemDefCancelRequested = output<void>();
}
