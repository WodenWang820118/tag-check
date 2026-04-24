import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [NgClass],
  templateUrl: './card.component.html',
})
export class CardComponent {
  @Input() cardTitle = 'Card Title';
  @Input() cardClass = '';
  @Input() blockClass = '';
  @Input() headerClass = '';
  @Input() hidHeader = false;
}
