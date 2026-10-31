import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { summarizeGa4Collect } from '@utils';

/**
 * The GA4 request a run captured, as GA4 reads it: event, measurement ID,
 * parameters, items and page. Without one it says where to look.
 */
@Component({
  selector: 'app-ga4-request',
  standalone: true,
  imports: [ClipboardModule],
  templateUrl: './ga4-request.component.html',
  styleUrls: ['./ga4-request.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Ga4RequestComponent {
  rawRequest = input<string | undefined>(undefined);
  requestPassed = input(false);
  /** False when the run made no request check (Request Check off). */
  requestChecked = input(true);
  eventName = input('');

  readonly summary = computed(() => {
    const raw = this.rawRequest();
    return raw ? summarizeGa4Collect(raw) : null;
  });

  /** Item columns, in the order their parameters first appear. */
  readonly itemColumns = computed(() => [
    ...new Set(
      (this.summary()?.items ?? []).flatMap((item) => Object.keys(item))
    )
  ]);

  readonly copied = signal(false);

  onCopied(done: boolean): void {
    this.copied.set(done);
  }
}
