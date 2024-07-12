import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-paginator-button',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <button mat-mini-fab [disabled]="disabled" (click)="onClick()">
      {{ label }}
    </button>
  `,
  styles: [
    `
      button {
        margin: 1%;
        background-color: white;
        color: black;
        margin-right: 1rem;
      }
    `,
  ],
})
export class PaginatorButtonComponent {
  @Input() label = '';
  @Input() disabled = false;
  @Input() onClick!: () => void;
}
