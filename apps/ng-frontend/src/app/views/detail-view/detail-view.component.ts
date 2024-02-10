import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ReportDetailsService } from '../../services/report-details/report-details.service';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { ReportDetails } from '../../models/report.interface';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [CommonModule, ReportDetailPanelsComponent],
  template: ` <div class="detail">
    <div class="detail__header">
      <h1>{{ (reportDetails$ | async)?.eventName }}</h1>
      <p>{{ (reportDetails$ | async)?.passed }}</p>
      <p>{{ (reportDetails$ | async)?.completedTime }}</p>
    </div>
    <div class="detail__content">
      <div class="detail__image">
        <p>Image Placeholder</p>
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
  subscriptions: Subscription[] = [];

  constructor(
    public reportDetailsService: ReportDetailsService,
    private router: Router
  ) {
    this.reportDetails$ = this.reportDetailsService.reportDetails$;
  }

  ngOnInit(): void {
    // TODO: how to do image retrieval from the json server?
    const reportDetailsSubscription = this.reportDetails$
      .pipe(
        tap((reportDetails) => {
          if (!reportDetails) {
            // this.router.navigate(['..']);
          }
        })
      )
      .subscribe();

    this.subscriptions.push(reportDetailsSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
