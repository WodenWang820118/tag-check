import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Observable,
  Subscription,
  combineLatest,
  of,
  tap,
  timeout,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportDetailsService } from '../../../../shared/services/report-details/report-details.service';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { IReportDetails } from '../../../../../../../../libs/utils/src/lib/interfaces/report.interface';
import { ImageService } from '../../../../shared/services/api/image/image.service';
import { BlobToUrlPipe } from '../../../../shared/pipes/blob-to-url-pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    ReportDetailPanelsComponent,
    BlobToUrlPipe,
    MatIconModule,
  ],
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss'],
})
export class DetailViewComponent implements OnInit, OnDestroy {
  reportDetails$!: Observable<IReportDetails | undefined>;
  image$!: Observable<Blob> | Observable<null>;
  subscriptions: Subscription[] = [];

  constructor(
    public reportDetailsService: ReportDetailsService,
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.reportDetails$ = this.reportDetailsService.reportDetails$;
    const reportDetailsSubscription = this.reportDetails$
      .pipe(
        timeout({
          each: 500,
          with: () =>
            this.reportDetails$.pipe(
              tap((reportDetails) => {
                if (!reportDetails) {
                  this.router.navigate(['../'], { relativeTo: this.route });
                } else {
                  console.log('Report details loaded');
                }
              })
            ),
        })
      )
      .subscribe();

    const imageSubscription = combineLatest([
      this.route.params,
      this.route.parent?.params || of({ projectSlug: '' }),
    ])
      .pipe(
        tap(([params, parentParams]) => {
          if (params && parentParams) {
            this.image$ = this.imageService.getImage(
              parentParams['projectSlug'],
              params['eventName']
            );
          }
        })
      )
      .subscribe();

    this.subscriptions.push(reportDetailsSubscription);
    this.subscriptions.push(imageSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
