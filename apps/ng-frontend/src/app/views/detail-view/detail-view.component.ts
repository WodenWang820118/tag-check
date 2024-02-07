import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, tap } from 'rxjs';
import { TestCase } from '../../models/project.interface';
import { Router } from '@angular/router';
import { TestCaseService } from '../../services/test-case/test-case.service';
import { TestDetailPanelsComponent } from '../../components/test-detail-panels/test-detail-panels.component';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [CommonModule, TestDetailPanelsComponent],
  template: ` <div class="detail">
    <div class="detail__header">
      <h1>{{ (testCase$ | async)?.eventName }}</h1>
      <p>{{ (testCase$ | async)?.passed }}</p>
      <p>{{ (testCase$ | async)?.completedTime }}</p>
    </div>
    <div class="detail__content">
      <div class="detail__image">
        <p>Image Placeholder</p>
      </div>
      <div class="detail__panels">
        <app-test-datail-panels
          [testCase$]="testCase$"
          [eventName]="(testCase$ | async)?.eventName"
        ></app-test-datail-panels>
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
  testCase$: Observable<TestCase | undefined>;
  subscriptions: Subscription[] = [];

  constructor(public testCaseService: TestCaseService, private router: Router) {
    this.testCase$ = this.testCaseService.testCase$;
  }

  ngOnInit(): void {
    // TODO: how to do image retrieval from the json server?
    const testCaseSubscription = this.testCase$
      .pipe(
        tap((testCase) => {
          if (!testCase) {
            this.router.navigate(['..']);
          }
        })
      )
      .subscribe();

    this.subscriptions.push(testCaseSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
