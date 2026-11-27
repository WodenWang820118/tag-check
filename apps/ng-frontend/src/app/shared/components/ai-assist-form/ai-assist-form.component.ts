import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { form, FormField, validate } from '@angular/forms/signals';
import {
  isOllamaModelName,
  normalizeOllamaUrl,
  type AiAssistResponse,
  type AiAssistSettings
} from '@utils';
import { AiAssistService } from '../../services/api/ai-assist/ai-assist.service';
import { apiErrorMessage } from '../../services/api/http-error.utils';
import { AiModelNoticeComponent } from '../ai-model-notice/ai-model-notice.component';

/**
 * Settings > AI assist, for every project on this computer: whether a model
 * on this computer suggests replacement selectors, Ollama's address, the
 * model, and whether Ollama can serve it.
 */
@Component({
  selector: 'app-ai-assist-form',
  standalone: true,
  imports: [
    FormField,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    AiModelNoticeComponent
  ],
  templateUrl: './ai-assist-form.component.html',
  styleUrls: ['./ai-assist-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiAssistFormComponent implements OnInit {
  private readonly aiAssist = inject(AiAssistService);
  private readonly snackBar = inject(MatSnackBar);

  readonly model = signal<AiAssistSettings>({
    enabled: false,
    ollamaUrl: '',
    model: ''
  });

  readonly f = form(this.model, (p) => {
    validate(p.ollamaUrl, ({ value }) =>
      normalizeOllamaUrl(value()) === null ? { kind: 'ollamaUrl' } : null
    );
    validate(p.model, ({ value }) =>
      isOllamaModelName(value().trim()) ? null : { kind: 'model' }
    );
  });

  /** The saved settings and whether Ollama can serve their model. */
  readonly state = signal<AiAssistResponse | null>(null);
  readonly checking = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);

  private readonly typedModel = computed(() =>
    this.f.model().value().trim().toLowerCase()
  );

  /**
   * Ollama's models that contain what is typed in Model; all of them while
   * Model names one, so another can be picked.
   */
  readonly modelOptions = computed(() => {
    const readiness = this.state()?.readiness;
    const models =
      readiness && readiness.kind !== 'runtimeUnavailable'
        ? readiness.models
        : [];
    const typed = this.typedModel();
    if (models.some((model) => model.toLowerCase() === typed)) {
      return models;
    }
    return models.filter((model) => model.toLowerCase().includes(typed));
  });

  ngOnInit(): void {
    void this.check(true);
  }

  /** Reads the saved settings and asks Ollama again; `fill` resets the form to them. */
  async check(fill = false): Promise<void> {
    this.checking.set(true);
    try {
      const state = await firstValueFrom(this.aiAssist.get());
      this.state.set(state);
      this.loadError.set(null);
      if (fill) {
        this.model.set(state.settings);
        this.f().reset(state.settings);
      }
    } catch (error) {
      this.loadError.set(
        apiErrorMessage(error, 'The AI assist settings could not be read.')
      );
    } finally {
      this.checking.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.f().invalid()) {
      this.f().markAsTouched();
      return;
    }
    const { enabled, ollamaUrl, model } = this.f().value();
    this.saving.set(true);
    try {
      const state = await firstValueFrom(
        this.aiAssist.update({ enabled, ollamaUrl, model: model.trim() })
      );
      this.state.set(state);
      this.model.set(state.settings);
      this.f().reset(state.settings);
      this.notify('AI assist settings saved.');
    } catch (error) {
      this.notify(apiErrorMessage(error, 'The settings could not be saved.'));
    } finally {
      this.saving.set(false);
    }
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
}
