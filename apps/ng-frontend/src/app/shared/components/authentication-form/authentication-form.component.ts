import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';
import { AuthenticationSetting, ProjectSetting } from '@utils';
import { SettingsService } from '../../services/api/settings/settings.service';

interface AuthenticationModel {
  username: string;
  password: string;
}

/** Settings > Authentication: the username and password a run signs in with. */
@Component({
  selector: 'app-authentication-form',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormField
  ],
  templateUrl: './authentication-form.component.html',
  styleUrls: ['./authentication-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class AuthenticationFormComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly route = inject(ActivatedRoute);

  /** The password is hidden until the user asks to see it. */
  readonly showPassword = signal(false);

  private readonly routeData = toSignal(this.route.data);

  readonly model = linkedSignal<AuthenticationModel>(() => {
    const settings = this.routeData()?.['projectInfo'] as
      | ProjectSetting
      | undefined;
    return {
      username: settings?.authenticationSettings?.username ?? '',
      password: settings?.authenticationSettings?.password ?? ''
    };
  });

  readonly f = form(this.model);

  async onSubmit(): Promise<void> {
    const params = this.route.parent?.params
      ? await firstValueFrom(this.route.parent.params)
      : undefined;
    const projectSlug = params?.['projectSlug'];
    if (!projectSlug) return;

    const current = this.model();
    const settings: Partial<AuthenticationSetting> = {
      username: current.username,
      password: current.password
    };

    try {
      await firstValueFrom(
        this.settingsService.updateAuthenticationSetting(projectSlug, settings)
      );
    } catch (err) {
      console.error(err);
    }
  }
}
