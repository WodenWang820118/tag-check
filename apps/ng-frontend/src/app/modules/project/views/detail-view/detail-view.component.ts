import { Component, effect, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportDetailsService } from '../../../../shared/services/report-details/report-details.service';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { IReportDetails } from '@utils';
import { ImageService } from '../../../../shared/services/api/image/image.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { VideosService } from '../../../../shared/services/api/videos/videos.service';
import { CarouselComponent } from '../../../../shared/components/carousel/carousel.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [
    ReportDetailPanelsComponent,
    MatIconModule,
    MatButtonModule,
    CarouselComponent,
    DatePipe,
    RouterLink
  ],
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss']
})
export class DetailViewComponent {
  readonly reportDetails = toSignal(this.reportDetailsService.reportDetails$, {
    initialValue: undefined as IReportDetails | undefined
  });

  // Route params signals
  private parentParams = toSignal(
    this.route.parent?.params || of({ projectSlug: '' }),
    {
      initialValue: { projectSlug: '' }
    }
  );

  private params = toSignal(this.route.params, {
    initialValue: { eventId: '' }
  });

  // Image and video signals
  readonly imageBlob = signal<Blob | null>(null);
  readonly videoBlob = signal<Blob | null>(null);

  constructor(
    public reportDetailsService: ReportDetailsService,
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute,
    private videosService: VideosService
  ) {
    // Handle report details loading and navigation
    effect(() => {
      const details = this.reportDetails();
      if (!details) {
        this.router.navigate(['../'], { relativeTo: this.route });
      } else {
        console.log('Report details loaded');
        console.log(details);
      }
    });

    // Media loading effect
    effect(() => {
      const projectSlug = this.parentParams()['projectSlug'];
      const eventId = this.params()['eventId'];

      if (projectSlug && eventId) {
        this.loadMedia(projectSlug, eventId);
      }
    });
  }

  private loadMedia(projectSlug: string, eventId: string): void {
    // Load image
    this.imageService.getImage(projectSlug, eventId).subscribe({
      next: (blob) => this.imageBlob.set(blob),
      error: (error) => {
        console.error('Error loading image:', error);
        this.imageBlob.set(null);
      }
    });

    // Load video
    this.videosService.getVideo(projectSlug, eventId).subscribe({
      next: (blob) => this.videoBlob.set(blob),
      error: (error) => {
        console.error('Error loading video:', error);
        this.videoBlob.set(null);
      }
    });
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
