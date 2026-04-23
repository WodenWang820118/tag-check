import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CarouselComponent } from '../../../../shared/components/carousel/carousel.component';
import { ReportTabViewModel } from '../report-detail.contracts';

@Component({
  selector: 'app-report-tab-view',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatChipsModule,
    MatMenuModule,
    CarouselComponent
  ],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header class="items-start">
        <div class="flex w-full items-start gap-3">
          <div class="min-w-0 flex-1">
            <mat-card-title class="truncate">
              {{ viewModel().title }}
            </mat-card-title>
            <mat-card-subtitle
              class="flex flex-wrap items-center gap-2 text-sm"
            >
              <time class="text-black/70" aria-label="Report created at">
                {{ viewModel().createdAt | date: 'medium' }}
              </time>
            </mat-card-subtitle>
          </div>

          <div class="flex items-center gap-2 self-start">
            <output class="sr-only" aria-live="polite" aria-atomic="true">
              {{ viewModel().passed ? 'Report passed' : 'Report failed' }}
            </output>
            <mat-chip-set aria-label="Report status">
              <mat-chip
                [color]="viewModel().passed ? 'primary' : 'warn'"
                class="w-full"
              >
                <div class="flex items-center gap-1">
                  {{ viewModel().passed ? 'Passed' : 'Failed' }}
                  <mat-icon style="transform: scale(0.85)">{{
                    viewModel().passed ? 'check_circle' : 'cancel'
                  }}</mat-icon>
                </div>
              </mat-chip>
            </mat-chip-set>

            @if (viewModel().showHistory) {
              <button
                mat-icon-button
                type="button"
                aria-label="View histories for this event"
                matTooltip="History"
                (click)="openHistory.emit()"
              >
                <mat-icon aria-hidden="true">history</mat-icon>
              </button>
            }

            @if (viewModel().showShareMenu) {
              <button
                mat-icon-button
                [matMenuTriggerFor]="shareMenu"
                aria-label="Share options"
                matTooltip="Share"
              >
                <mat-icon>share</mat-icon>
              </button>

              <mat-menu #shareMenu="matMenu">
                <button
                  mat-menu-item
                  type="button"
                  (click)="exportSpreadsheet.emit()"
                  [disabled]="!viewModel().canExportSpreadsheet"
                >
                  <mat-icon aria-hidden="true">table_view</mat-icon>
                  <span>Export spreadsheet (XLSX)</span>
                </button>
                <button
                  mat-menu-item
                  type="button"
                  (click)="exportRecording.emit()"
                  [disabled]="!viewModel().canExportRecording"
                >
                  <mat-icon aria-hidden="true">movie</mat-icon>
                  <span>Export recording (WEBM)</span>
                </button>
                <mat-divider></mat-divider>
                <button
                  mat-menu-item
                  type="button"
                  (click)="exportEvent.emit()"
                  [disabled]="!viewModel().canExportEvent"
                >
                  <mat-icon aria-hidden="true">download</mat-icon>
                  <span>Export event (XLSX + WEBM)</span>
                </button>
              </mat-menu>
            }
          </div>
        </div>
      </mat-card-header>

      <mat-divider class="my-2"></mat-divider>

      <mat-card-content class="pt-2">
        <div
          class="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]"
        >
          <section class="space-y-4 mt-10">
            <mat-form-field class="w-full" appearance="fill">
              <mat-label>Event name</mat-label>
              <input
                matInput
                [readonly]="true"
                [value]="viewModel().eventName"
                aria-label="Event name"
                aria-readonly="true"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="copyEventName.emit()"
                [disabled]="!viewModel().eventName"
                aria-label="Copy event name"
                matTooltip="Copy event name"
              >
                <mat-icon>content_copy</mat-icon>
              </button>
            </mat-form-field>

            <ng-content select="[report-detail-content]"></ng-content>

            <mat-form-field class="w-full mt-5" appearance="fill">
              <mat-label>Message</mat-label>
              <textarea
                matInput
                [rows]="3"
                [readonly]="true"
                [value]="viewModel().message"
                aria-label="Report message"
              ></textarea>
            </mat-form-field>
          </section>

          <section class="space-y-4 mt-10">
            @if (viewModel().hasMedia) {
              <mat-accordion displayMode="flat">
                <mat-expansion-panel [expanded]="!viewModel().passed">
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <span class="flex items-center">
                        <mat-icon aria-hidden="true">movie</mat-icon>
                        <span class="ml-2">Media (Video & Screenshots)</span>
                      </span>
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <div
                    id="media-content"
                    class="max-h-[260px] overflow-hidden rounded-b-lg border-t border-black/10"
                    aria-label="Media content"
                  >
                    <app-carousel
                      [imageBlob]="viewModel().imageBlob"
                      [videoBlob]="viewModel().videoBlob"
                    ></app-carousel>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            } @else {
              <mat-card appearance="outlined" class="mt-2 p-4">
                <div class="flex items-start gap-3">
                  <mat-icon aria-hidden="true" color="primary">
                    image_not_supported
                  </mat-icon>
                  <div class="min-w-0">
                    <div class="text-2xl">No media available</div>
                    <p class="text-xl text-black/70 m-0 mt-1">
                      Screenshots and the test recording will appear here when
                      captured.
                    </p>
                    <ul class="list-disc pl-5 text-xl text-black/70 mt-2">
                      <li>Media capture may be disabled for this run.</li>
                      <li>
                        Some runs may not produce screenshots if nothing changed
                        visually.
                      </li>
                    </ul>
                  </div>
                </div>
              </mat-card>
            }
          </section>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class ReportTabViewComponent {
  viewModel = input.required<ReportTabViewModel>();

  copyEventName = output<void>();
  exportSpreadsheet = output<void>();
  exportRecording = output<void>();
  exportEvent = output<void>();
  openHistory = output<void>();
}
