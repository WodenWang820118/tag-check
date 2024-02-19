import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, combineLatest, of, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportDetailsService } from '../../services/report-details/report-details.service';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { ReportDetails } from '../../models/report.interface';
import { ImageService } from '../../services/api/image/image.service';
import { BlobToUrlPipe } from '../../pipe/blob-to-url-pipe';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [CommonModule, ReportDetailPanelsComponent, BlobToUrlPipe],
  template: ` <div class="detail">
    <div class="detail__header">
      <h1>{{ (reportDetails$ | async)?.eventName }}</h1>
      <p>{{ (reportDetails$ | async)?.passed }}</p>
      <p>{{ (reportDetails$ | async)?.completedTime }}</p>
    </div>
    <div class="detail__content">
      <div class="detail__image">
        <img
          *ngIf="image$ | async as imageBlob"
          [src]="imageBlob | blobToUrl"
          alt="Loaded image"
        />
      </div>
      <div class="detail__panels">
        <app-report-datail-panels
          [reportDetails$]="reportDetails$"
          [eventName]="(reportDetails$ | async)?.eventName"
        ></app-report-datail-panels>
      </div>
    </div>
  </div>`,
  styles: `
    .detail {
      padding: 2rem 10rem;
      &__header {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 2rem;
      }

      &__content {
        display: flex;
        flex-direction: row;
        gap: 2rem;
      }

      &__panels {
        flex: 1 1 0;
        max-width: 40vw;
      }

      &__image {
        flex: 1 1 0;
        max-width: 40vw;
      }
    }
  `,
})
export class DetailViewComponent implements OnInit, OnDestroy {
  reportDetails$: Observable<ReportDetails | undefined>;
  image$!: Observable<Blob> | Observable<null>;
  subscriptions: Subscription[] = [];

  constructor(
    public reportDetailsService: ReportDetailsService,
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.reportDetails$ = this.reportDetailsService.reportDetails$;
  }

  ngOnInit(): void {
    console.log('DetailViewComponent ngOnInit');
    const reportDetailsSubscription = this.reportDetails$.pipe().subscribe();

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
