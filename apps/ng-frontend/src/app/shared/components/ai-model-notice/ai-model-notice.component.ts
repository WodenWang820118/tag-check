import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import type { AiAssistReadiness } from '@utils';

/**
 * What to do before the local model can be asked: start Ollama, or download
 * the model with the command shown. Shows nothing once the model is ready.
 * TagCheck never installs Ollama or downloads a model itself.
 */
@Component({
  selector: 'app-ai-model-notice',
  standalone: true,
  imports: [ClipboardModule, MatButtonModule],
  templateUrl: './ai-model-notice.component.html',
  styleUrls: ['./ai-model-notice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiModelNoticeComponent {
  readiness = input<AiAssistReadiness | null>(null);
  /** The model the settings name. */
  model = input('');
  /** True while a check runs, to disable Check again. */
  checking = input(false);
  /** Check again was selected. */
  recheck = output<void>();

  readonly copied = signal(false);

  onCopied(done: boolean): void {
    this.copied.set(done);
  }
}
