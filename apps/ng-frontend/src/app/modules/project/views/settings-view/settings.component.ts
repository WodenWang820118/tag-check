import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService } from '../../../../shared/services/api/project/project.service';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { Project } from '../../../../shared/models/project.interface';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { RootFormComponent } from '../../../../shared/components/root-form/root-form.component';
import { ApplicationFormComponent } from '../../../../shared/components/application-form/application-form.component';
import { SettingsFormComponent } from '../../../../shared/components/settings-form/settings-form.component';
@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatListModule,
    MatCardModule,
    MatFormFieldModule,
    ToolbarComponent,
    MatInputModule,
    MatGridListModule,
    RootFormComponent,
    ApplicationFormComponent,
    SettingsFormComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SettingsViewComponent implements OnInit, OnDestroy {
  project$!: Observable<Project>;
  projects$!: Observable<Project[]>;
  destroy$ = new Subject<void>();

  rootForm = this.fb.group({
    name: [''],
  });

  constructor(
    private route: ActivatedRoute,
    public projectService: ProjectService,
    private fb: FormBuilder
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

    this.projects$ = this.projectService.getProjects();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
