import {
  Component,
  Input,
  ViewEncapsulation,
  ChangeDetectionStrategy
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
  // empty constructor removed
}
