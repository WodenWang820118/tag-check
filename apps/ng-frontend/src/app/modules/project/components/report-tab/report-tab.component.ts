import { DatePipe } from '@angular/common';
import { Component, computed, input, inject } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VideoDialogComponent } from '../../../../shared/components/video-dialog/video-dialog.component';

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
    MatDialogModule,
    // Shared/feature components
    CarouselComponent,
    ReportDetailPanelsComponent
  ],
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
              <!-- TODO: color state -->
              <mat-chip
                [color]="reportDetails$()?.passed ? 'primary' : 'warn'"
                class="w-full"
              >
                <div class="flex items-center gap-1">
                  {{ reportDetails$()?.passed ? 'Passed' : 'Failed' }}
                  <mat-icon style="transform: scale(0.85);">{{
                    reportDetails$()?.passed ? 'check_circle' : 'cancel'
                  }}</mat-icon>
                </div>
              </mat-chip>
            </mat-chip-set>

            @if (testEventDetails$().length) {
              <button
                mat-stroked-button
                [routerLink]="historyLinkCommands$() ?? ['..', 'buckets']"
                [queryParams]="{ event: reportDetails$()?.eventName }"
                aria-label="View run history for this event"
                class="whitespace-nowrap"
              >
                <mat-icon class="mr-1.5" aria-hidden="true">history</mat-icon>
                History
              </button>
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
            @if (imageBlob$() || videoBlob$()) {
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
                      (videoClick)="openVideoDialog()"
                    ></app-carousel>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            } @else {
              <p class="text-black/60 mt-2 flex items-center gap-2">
                <mat-icon aria-hidden="true">image_not_supported</mat-icon>
                No media captured for this run.
              </p>
            }
          </section>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['./report-tab.component.scss']
})
export class ReportTabComponent {
  // Inputs as signals (Angular v17+)
  reportDetails = input<IReportDetails | undefined>(undefined);
  tagSpec = input<TagSpec | undefined>(undefined);
  videoBlob = input<Blob | null>(null);
  imageBlob = input<Blob | null>(null);
  frontFileReport = input<FrontFileReport[]>([]);
  historyLinkCommands = input<string[] | undefined>(undefined);

  // Readonly accessors for template ergonomics
  reportDetails$ = computed(() => this.reportDetails());
  tagSpec$ = computed(() => this.tagSpec());
  videoBlob$ = computed(() => this.videoBlob());
  imageBlob$ = computed(() => this.imageBlob());
  testEventDetails$ = computed(() =>
    (this.frontFileReport() || []).flatMap((r) => r.testEventDetails)
  );
  historyLinkCommands$ = computed(() => this.historyLinkCommands());

  private readonly dialog = inject(MatDialog);
  constructor(private readonly snackBar: MatSnackBar) {}

  copyEventName() {
    const value = this.reportDetails$()?.eventName;
    if (!value) return;
    const write = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (write) {
      write(value)
        .then(() => {
          this.snackBar.open('Event name copied', undefined, {
            duration: 1500,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        })
        .catch(() => {
          this.snackBar.open('Unable to copy', undefined, {
            duration: 1500,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        });
    } else {
      this.snackBar.open('Unable to copy', undefined, {
        duration: 1500,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }
  }

  openVideoDialog() {
    const blob = this.videoBlob$();
    if (!blob) return;
    this.dialog.open(VideoDialogComponent, {
      data: { blob },
      width: '1420px',
      height: '1200px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'app-video-dialog-panel'
    });
  }
}
