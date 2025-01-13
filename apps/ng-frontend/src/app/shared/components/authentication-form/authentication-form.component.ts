import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, switchMap, take, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { Setting } from '@utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    FormsModule
  ],
  templateUrl: './authentication-form.component.html',
  styleUrls: ['./authentication-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthenticationFormComponent implements OnInit {
  authenticationForm = this.fb.group({
    username: [''],
    password: ['']
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
          const settings = data['projectInfo'].settings;
          if (settings) {
            this.authenticationForm.patchValue({
              username: settings.authentication.username,
              password: settings.authentication.password
            });
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
          console.log(this.authenticationForm.value);
          console.log(projectSlug);

          const settings: Partial<Setting> = {
            authentication: {
              username: this.authenticationForm.value.username as string,
              password: this.authenticationForm.value.password as string
            }
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
}
