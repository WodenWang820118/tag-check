import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  of,
  pipe,
  takeUntil,
  tap,
  timeout,
} from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReportDetailsService } from '../../../../shared/services/report-details/report-details.service';
import { ReportDetailPanelsComponent } from '../../components/report-detail-panels/report-detail-panels.component';
import { CarouselItem, IReportDetails } from '@utils';
import { ImageService } from '../../../../shared/services/api/image/image.service';
import { BlobToUrlPipe } from '../../../../shared/pipes/blob-to-url-pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { VideosService } from '../../../../shared/services/api/videos/videos.service';
import { CarouselComponent } from '../../../../shared/components/carousel/carousel.component';

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
    CarouselComponent,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss'],
})
export class DetailViewComponent implements OnInit, OnDestroy {
  reportDetails$!: Observable<IReportDetails | undefined>;
  image$!: Observable<Blob | null>;
  video$!: Observable<Blob | null>;
  private carouselItemsSubject = new BehaviorSubject<CarouselItem[]>([]);
  carouselItems$: Observable<CarouselItem[]> =
    this.carouselItemsSubject.asObservable();
  destroy$ = new Subject<void>();

  constructor(
    public reportDetailsService: ReportDetailsService,
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute,
    private videosService: VideosService
  ) {}

  ngOnInit(): void {
    this.reportDetails$ = this.reportDetailsService.reportDetails$;
    this.reportDetails$
      .pipe(
        takeUntil(this.destroy$),
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

    combineLatest([
      this.route.params,
      this.route.parent?.params || of({ projectSlug: '' }),
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([params, parentParams]) => {
          if (params && parentParams) {
            this.image$ = this.imageService.getImage(
              parentParams['projectSlug'],
              params['eventId']
            );

            this.video$ = this.videosService.getVideo(
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

    combineLatest([this.image$, this.video$])
      .pipe(
        map(([imageBlob, videoBlob]) => {
          const items: CarouselItem[] = [];
          if (imageBlob !== null) {
            items.push({
              type: 'image',
              url: new BlobToUrlPipe().transform(imageBlob) || '',
            });
          }
          if (videoBlob) {
            items.push({
              type: 'video',
              url: new BlobToUrlPipe().transform(videoBlob) || '',
            });
          }
          return items;
        })
      )
      .subscribe((items) => this.carouselItemsSubject.next(items));
  }

  goBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
