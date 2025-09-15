import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { CarouselComponent } from '../../../../shared/components/carousel/carousel.component';
import { ReportDetailPanelsComponent } from '../report-detail-panels/report-detail-panels.component';
import { IReportDetails, TagSpec, FrontFileReport } from '@utils';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { ReportTabFacade } from './report-tab-facade.service';

@Component({
  selector: 'app-report-tab',
  standalone: true,
  imports: [
    // Angular
    DatePipe,
    RouterLink,
    // Material
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatChipsModule,
    MatSnackBarModule,
    MatMenuModule,
    // Shared/feature components
    CarouselComponent,
    ReportDetailPanelsComponent
  ],
  providers: [ReportTabFacade],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header class="items-start">
        <div class="flex w-full items-start gap-3">
          <div class="min-w-0 flex-1">
            <mat-card-title class="truncate">
              {{ tagSpec$()?.rawGtmTag?.tag?.name || 'Report' }}
            </mat-card-title>
            <mat-card-subtitle
              class="flex flex-wrap items-center gap-2 text-sm"
            >
              <time class="text-black/70" aria-label="Report created at">
                {{ reportDetails$()?.createdAt | date: 'medium' }}
              </time>
            </mat-card-subtitle>
          </div>

          <div class="flex items-center gap-2 self-start">
            <output class="sr-only" aria-live="polite" aria-atomic="true">
              {{ reportDetails$()?.passed ? 'Report passed' : 'Report failed' }}
            </output>
            <mat-chip-set aria-label="Report status">
              <mat-chip
                [color]="reportDetails$()?.passed ? 'primary' : 'warn'"
                class="w-full"
              >
                <div class="flex items-center gap-1">
                  {{ reportDetails$()?.passed ? 'Passed' : 'Failed' }}
                  <mat-icon style="transform: scale(0.85)">{{
                    reportDetails$()?.passed ? 'check_circle' : 'cancel'
                  }}</mat-icon>
                </div>
              </mat-chip>
            </mat-chip-set>

            @if (testEventDetails$().length) {
              <!-- History: icon-only button -->
              <button
                mat-icon-button
                [routerLink]="historyLinkCommands$() ?? ['..', 'buckets']"
                [queryParams]="{ event: reportDetails$()?.eventName }"
                aria-label="View histories for this event"
                matTooltip="History"
              >
                <mat-icon aria-hidden="true">history</mat-icon>
              </button>

              <!-- Share button (icon only) -->
              <button
                mat-icon-button
                [matMenuTriggerFor]="shareMenu"
                aria-label="Share options"
                matTooltip="Share"
              >
                <mat-icon>share</mat-icon>
              </button>

              <!-- Share menu overlay -->
              <mat-menu #shareMenu="matMenu">
                <button
                  mat-menu-item
                  type="button"
                  (click)="shareSpreadsheet()"
                  [disabled]="!projectSlug$() || !reportDetails$()?.eventId"
                >
                  <mat-icon aria-hidden="true">table_view</mat-icon>
                  <span>Export spreadsheet (XLSX)</span>
                </button>
                <button
                  mat-menu-item
                  type="button"
                  (click)="exportRecording()"
                  [disabled]="!recordingAvailable$()"
                >
                  <mat-icon aria-hidden="true">movie</mat-icon>
                  <span>Export recording (WEBM)</span>
                </button>
                <mat-divider></mat-divider>
                <button
                  mat-menu-item
                  type="button"
                  (click)="exportEvent()"
                  [disabled]="
                    !reportDetails$()?.eventId ||
                    !projectSlug$() ||
                    !recordingAvailable$()
                  "
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
          <!-- Left: Details -->
          <section class="space-y-4 mt-10">
            <mat-form-field class="w-full" appearance="fill">
              <mat-label>Event name</mat-label>
              <input
                matInput
                [readonly]="true"
                [value]="reportDetails$()?.eventName || ''"
                aria-label="Event name"
                aria-readonly="true"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="copyEventName()"
                [disabled]="!reportDetails$()?.eventName"
                aria-label="Copy event name"
                matTooltip="Copy event name"
              >
                <mat-icon>content_copy</mat-icon>
              </button>
            </mat-form-field>

            <app-report-datail-panels
              [reportDetails]="reportDetails$()"
            ></app-report-datail-panels>

            <mat-form-field class="w-full mt-5" appearance="fill">
              <mat-label>Message</mat-label>
              <textarea
                matInput
                [rows]="3"
                [readonly]="true"
                [value]="reportDetails$()?.message || ''"
                aria-label="Report message"
              ></textarea>
            </mat-form-field>
          </section>

          <!-- Right: Media -->
          <section class="space-y-4 mt-10">
            @if (
              (imageBlob$()?.size || 0) > 0 && (videoBlob$()?.size || 0) > 0
            ) {
              <mat-accordion displayMode="flat">
                <mat-expansion-panel
                  [expanded]="reportDetails$()?.passed === false"
                >
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
                      [imageBlob]="imageBlob$()"
                      [videoBlob]="videoBlob$()"
                    ></app-carousel>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            } @else {
              <mat-card appearance="outlined" class="mt-2 p-4">
                <div class="flex items-start gap-3">
                  <mat-icon aria-hidden="true" color="primary"
                    >image_not_supported</mat-icon
                  >
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
  `,
  styleUrls: ['./report-tab.component.scss']
})
export class ReportTabComponent {
  reportDetails = input<IReportDetails | undefined>(undefined);
  tagSpec = input<TagSpec | undefined>(undefined);
  videoBlob = input<Blob | undefined>(undefined);
  imageBlob = input<Blob | undefined>(undefined);
  frontFileReport = input<FrontFileReport[]>([]);
  historyLinkCommands = input<string[] | undefined>(undefined);

  reportDetails$ = computed(() => this.reportDetails());
  tagSpec$ = computed(() => this.tagSpec());
  videoBlob$ = computed(() => this.videoBlob());
  imageBlob$ = computed(() => this.imageBlob());
  testEventDetails$ = computed(() =>
    (this.frontFileReport() || []).flatMap((r) => r.testEventDetails)
  );
  historyLinkCommands$ = computed(() => this.historyLinkCommands());
  projectSlug$ = computed(() => this.facade.getProjectSlugFromRoute());
  recordingAvailable$ = computed(() =>
    this.facade.getRecordingAvailable(this.videoBlob$())
  );

  constructor(private readonly facade: ReportTabFacade) {}

  copyEventName() {
    this.facade.copyEventName(this.reportDetails$());
  }

  // Share helpers

  shareSpreadsheet() {
    this.facade.shareSpreadsheet(this.reportDetails$());
  }

  // project slug + spreadsheet url helpers moved to facade

  openRecording() {
    // Deprecated: replaced by exportRecording()
    this.exportRecording();
  }

  exportRecording() {
    this.facade.exportRecording(this.reportDetails$(), this.videoBlob$());
  }

  exportEvent() {
    this.facade.exportEvent(this.reportDetails$(), this.videoBlob$());
  }

  // saveBlob/buildFileBase moved to facade
}
