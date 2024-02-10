import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/api/project/project.service';
import { Observable, Subscription, take, tap } from 'rxjs';
import { Project } from '../../models/project.interface';
import { SideNavbarComponent } from '../../components/side-navbar/side-navbar.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    SideNavbarComponent,
    ReportTableComponent,
  ],
  template: `
    <div class="project">
      <div class="project__content">
        <div class="container">
          <app-side-navbar
            class="grid_item"
            [project$]="project$"
            [projects$]="projects$"
          ></app-side-navbar>
          <div class="grid_item project__table">
            <app-report-table [project$]="project$"></app-report-table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .project {
      .container {
        display: grid;
        grid-template-columns: 1fr 3fr; /* Creates two columns */
        gap: 10px; /* Space between rows and columns */
        height: 100vh;
      }

      &__table {
        border-left: 1px solid;
        padding: 2rem 4rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;        
      }
    }
  `,
})
export class ProjectViewComponent implements OnInit, OnDestroy {
  project$!: Observable<Project>;
  projects$!: Observable<Project[]>;
  subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    public projectService: ProjectService
  ) {}

  ngOnInit(): void {
    const routeSubscription = this.route.params
      .pipe(
        take(1),
        tap((params) => {
          // console.log(params);
          this.project$ = this.projectService.switchToProject(
            params['projectSlug']
          );
        })
      )
      .subscribe();

    this.projects$ = this.projectService.getProjects();
    this.subscriptions.push(routeSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
