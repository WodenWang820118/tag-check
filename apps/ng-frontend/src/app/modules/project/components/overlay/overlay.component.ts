import {
  Component,
  Input,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  output
} from '@angular/core';
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [OverlayModule],
  template: `
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayOffsetX]="50"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="closed.emit()"
      (overlayKeydown)="$event.key === 'Escape' && closed.emit()"
    >
      <ng-content></ng-content>
    </ng-template>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class OverlayComponent {
  @Input() trigger!: CdkOverlayOrigin;
  @Input() isOpen!: boolean;
  /** Emitted when the user clicks outside the overlay or presses Escape. */
  readonly closed = output<void>();
  // empty constructor removed
}
