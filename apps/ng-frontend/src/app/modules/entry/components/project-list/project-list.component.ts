import { RouterLink } from '@angular/router';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ProjectItemComponent } from '../project-item/project-item.component';
import { MatCardModule } from '@angular/material/card';
import { BehaviorSubject, Observable, Subject, takeUntil, tap } from 'rxjs';
import { ProjectInfo } from '@utils';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { MatTableDataSource } from '@angular/material/table';
import { MetadataSourceService } from '../../../../shared/services/metadata-source/metadata-source.service';
import { MetadataSourceFacadeService } from '../../../../shared/services/facade/metadata-source-facade.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    AsyncPipe,
    ProjectItemComponent,
    MatCardModule,
    RouterLink,
    PaginatorComponent,
  ],
  template: `
    <div class="project-list">
      <div class="project-list__items">
        <div class="project-list__new" [routerLink]="['init-project']">
          <mat-card class="project-list__items__item">
            <mat-card-header>
              <mat-card-title>New Project</mat-card-title>
              <mat-card-subtitle>Create a new automation</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p></p>
            </mat-card-content>
          </mat-card>
        </div>
        @for (item of displayedProjects | async; track item.projectSlug) {
        <app-project-item
          class="project-list__items__item"
          [project]="item"
        ></app-project-item>
        }
      </div>
      <app-paginator
        #paginatorComponent
        [pageSize]="5"
        [length]="this.dataSourceLength | async"
      ></app-paginator>
    </div>
  `,
  styles: `
    .mat-mdc-card {
      height: 200px;
      min-width: 400px;
      max-width: 500px;
    }

    .project-list {
      display: flex;
      flex-direction: column;
      align-items: center;

      &__new {
        cursor: pointer;
      }

      &__items {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin-bottom: 10rem;
        gap: 4rem;

        &__item {
          flex: 1 0 50%;
        }
      }
    }
  `,
})
export class ProjectListComponent implements AfterViewInit, OnDestroy {
  dataSource: MatTableDataSource<ProjectInfo> =
    new MatTableDataSource<ProjectInfo>();

  @ViewChild('paginatorComponent', { static: true })
  paginatorComponent!: PaginatorComponent;
  displayedProjects!: Observable<ProjectInfo[]>;
  dataSourceLength = new BehaviorSubject<number>(0);
  destroy$ = new Subject<void>();

  constructor(
    private metadataSourceService: MetadataSourceService,
    private metadataSourceFacadeService: MetadataSourceFacadeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.metadataSourceService
      .getData()
      .pipe(
        takeUntil(this.destroy$),
        tap((projects) => {
          if (!projects) return;
          this.dataSource = new MatTableDataSource<ProjectInfo>(projects);
          this.displayedProjects = this.dataSource.connect();
          this.dataSource.paginator = this.paginatorComponent.paginator;
          this.dataSourceLength.next(projects.length);
          this.cdr.detectChanges();
        })
      )
      .subscribe();

    this.metadataSourceFacadeService
      .observeTableFilter()
      .pipe(
        takeUntil(this.destroy$),
        tap((filter) => {
          this.dataSource.filter = filter;
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
