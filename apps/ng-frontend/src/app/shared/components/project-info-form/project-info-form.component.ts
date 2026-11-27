import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal
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
import { Project, ProjectSetting } from '@utils';
import { SettingsService } from '../../services/api/settings/settings.service';

interface ProjectInfoModel {
  projectName: string;
  measurementId: string;
  projectDescription: string;
}

/**
 * Settings > Project information: the project's name, description and
 * measurement ID.
 */
@Component({
  selector: 'app-project-info-form',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormField
  ],
  templateUrl: './project-info-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./project-info-form.component.scss']
})
export class ProjectInfoFormComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly route = inject(ActivatedRoute);

  private readonly routeData = toSignal(this.route.data);

  readonly model = linkedSignal<ProjectInfoModel>(() => {
    const settings = this.routeData()?.['projectInfo'] as
      | ProjectSetting
      | undefined;
    return {
      projectName: settings?.projectName ?? '',
      measurementId: settings?.measurementId ?? '',
      projectDescription: settings?.projectDescription ?? ''
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
    const settings: Partial<Project> = {
      projectName: current.projectName || '',
      measurementId: current.measurementId || '',
      projectDescription: current.projectDescription || ''
    };

    try {
      await firstValueFrom(
        this.settingsService.updateProjectSetting(projectSlug, settings)
      );
    } catch (err) {
      console.error(err);
    }
  }
}
