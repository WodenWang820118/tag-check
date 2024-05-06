import { Component, Input, ViewEncapsulation } from '@angular/core';
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
  styles: `
  `,
  encapsulation: ViewEncapsulation.None,
})
export class OverlayComponent {
  @Input() trigger!: CdkOverlayOrigin;
  @Input() isOpen!: boolean;
  constructor() {}
}
