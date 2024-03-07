import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../../../shared/services/api/project/project.service';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { Project } from '../../../../shared/models/project.interface';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { SideNavListComponent } from '../../components/side-nav-list/side-nav-list.component';
import { ReportTableToolbarComponent } from '../../components/report-table-toolbar/report-table-toolbar.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    ReportTableComponent,
    MatSidenavModule,
    MatListModule,
    MatGridListModule,
    ToolbarComponent,
    SideNavListComponent,
    ReportTableComponent,
    ReportTableToolbarComponent,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ReportViewComponent implements OnInit, OnDestroy {
  project$!: Observable<Project>;
  destroy$ = new Subject<void>();
  previewMode = false;

  constructor(
    private route: ActivatedRoute,
    public projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        tap((params) => {
          // console.log(params);
          this.project$ = this.projectService.switchToProject(
            params['projectSlug']
          );
        })
      )
      .subscribe();
  }

  onChangeGtmPreviewMode(event: boolean) {
    console.log(event);
    this.previewMode = event;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
