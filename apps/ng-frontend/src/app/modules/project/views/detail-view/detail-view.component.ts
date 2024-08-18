import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import {
  Observable,
  Subscription,
  catchError,
  combineLatest,
  of,
  tap,
  timeout,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportDetailsService } from '../../../../shared/services/report-details/report-details.service';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { IReportDetails } from '@utils';
import { ImageService } from '../../../../shared/services/api/image/image.service';
import { BlobToUrlPipe } from '../../../../shared/pipes/blob-to-url-pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [
    AsyncPipe,
    NgIf,
    ReportDetailPanelsComponent,
    BlobToUrlPipe,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss'],
})
export class DetailViewComponent implements OnInit, OnDestroy {
  reportDetails$!: Observable<IReportDetails | undefined>;
  image$!: Observable<Blob | null>;
  subscriptions: Subscription[] = [];

  constructor(
    public reportDetailsService: ReportDetailsService,
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // TODO: avaoid manual subscription and unsubscription
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
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return of(null);
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
              params['eventId']
            );
          }
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return of(null);
        })
      )
      .subscribe();

    this.subscriptions.push(reportDetailsSubscription);
    this.subscriptions.push(imageSubscription);
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
