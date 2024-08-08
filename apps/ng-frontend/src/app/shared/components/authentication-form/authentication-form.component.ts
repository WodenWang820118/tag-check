import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { Setting } from '@utils';

@Component({
  selector: 'app-authentication-form',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './authentication-form.component.html',
  styleUrls: ['./authentication-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthenticationFormComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();

  authenticationForm = this.fb.group({
    username: [''],
    password: [''],
  });

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          return this.settingsService.getProjectSettings(projectSlug);
        }),
        tap((project) => {
          if (project.settings) {
            const settings = project.settings;
            this.authenticationForm.patchValue({
              username: settings.authentication.username,
              password: settings.authentication.password,
            });
          }
        }),
        catchError((err) => {
          console.error(err);
          return [];
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
          console.log(this.authenticationForm.value);
          console.log(projectSlug);

          const settings: Partial<Setting> = {
            authentication: {
              username: this.authenticationForm.value.username as string,
              password: this.authenticationForm.value.password as string,
            },
          };

          return this.settingsService.updateSettings(
            projectSlug,
            'authentication',
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
