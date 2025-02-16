import { Component, DestroyRef, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, switchMap, take, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { Project, ProjectSchema, ProjectSetting } from '@utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-project-info-form',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './project-info-form.component.html',
  styleUrls: ['./project-info-form.component.scss']
})
export class ProjectInfoFormComponent implements OnInit {
  projectInfoForm = this.fb.group({
    projectName: [''],
    measurementId: [''],
    projectDescription: ['']
  });

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((data) => {
          const settings: ProjectSetting = data['projectInfo'];
          if (settings) {
            this.projectInfoForm.patchValue(settings);
          }
        })
      )
      .subscribe();
  }

  onSubmit() {
    this.route.parent?.params
      .pipe(
        take(1),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          console.log(this.projectInfoForm.value);
          console.log(projectSlug);

          const settings: Partial<Project> = {
            projectName: this.projectInfoForm.value.projectName as string,
            measurementId: this.projectInfoForm.value.measurementId as string,
            projectDescription: this.projectInfoForm.value
              .projectDescription as string
          };
          return this.settingsService.updateProjectSetting(
            projectSlug,
            settings
          );
        }),
        catchError((err) => {
          console.error(err);
          return [];
        })
      )
      .subscribe();
  }
}
