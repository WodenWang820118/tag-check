import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { IReportDetails } from '@utils';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarouselComponent } from '../../../../shared/components/carousel/carousel.component';
import { Observable } from 'rxjs';

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
export class DetailViewComponent implements OnInit {
  reportDetails = signal<IReportDetails | undefined>(undefined);
  imageBlob = signal<Blob | null>(null);
  videoBlob = signal<Blob | null>(null);

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const reportDetails = data['reportDetails'];
      const video = data['video'] as { blob: Blob; hasVideo: boolean };
      const image = data['image'];
      this.reportDetails.set(reportDetails);
      this.videoBlob.set(video.hasVideo ? video.blob : null);
      this.imageBlob.set(image);
    });
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
