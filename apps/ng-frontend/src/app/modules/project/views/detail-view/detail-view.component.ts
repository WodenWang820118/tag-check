import { Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import {
  FrontFileReport,
  IReportDetails,
  TestEvent,
  TestEventDetail,
  TestImage
} from '@utils';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarouselComponent } from '../../../../shared/components/carousel/carousel.component';

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

  imageBlob$ = computed(() => this.imageBlob());
  videoBlob$ = computed(() => this.videoBlob());
  frontFileReport = signal([] as FrontFileReport[]);
  testEventDetail$ = computed(() =>
    this.frontFileReport().flatMap((report) => report.testEventDetails)
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      console.log('Route data:', data);
      const fileReports = data['fileReports'] as FrontFileReport[];
      this.frontFileReport.set(fileReports);

      const reportDetailsObject = data['reportDetails'] as {
        testEvent: TestEvent;
        testEventDetail: TestEventDetail;
        testImage: TestImage;
      };
      // Flatten the array of objects into a single object
      console.log('Report details object:', reportDetailsObject);
      const flattenedReportDetails: IReportDetails = {
        ...reportDetailsObject.testEvent,
        ...reportDetailsObject.testEventDetail,
        ...reportDetailsObject.testImage,
        position: 0,
        event: reportDetailsObject.testEvent.eventName,
        createdAt: new Date()
      };
      console.log('Flattened report details:', flattenedReportDetails);
      const video = data['video'] as { blob: Blob | null };
      const image = data['image'] as { blob: Blob | null };
      this.reportDetails.set(flattenedReportDetails);
      this.videoBlob.set(video.blob);
      this.imageBlob.set(image.blob);
    });
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
