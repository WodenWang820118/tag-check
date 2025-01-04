import { JsonPipe } from '@angular/common';
import { Component, Inject, LOCALE_ID } from '@angular/core';

@Component({
  selector: 'lib-about',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  exampleInput = {
    comments: '----- usual event data -----',
    event: 'begin_checkout',
    ecommerce: {
      value: '$value',
      currency: '$currency',
      items: [
        {
          item_id: '$item_id',
          item_name: '$item_name',
          item_brand: '$item_brand',
          item_category: '$item_category',
          item_category2: '$item_category2',
          item_category3: '$item_category3',
          item_category4: '$item_category4',
          item_category5: '$item_category5',
          discount: '$discount',
          price: '$value',
          quantity: '$quantity',
          coupon: '$coupon',
          index: '$index',
          item_variant: '$item_variant'
        }
      ]
    }
  };
  exampleArrayInput = [
    {
      comments: '----- Tag Build format -----',
      event: 'another_event'
    },
    this.exampleInput
  ];

  constructor(@Inject(LOCALE_ID) private locale: string) {}

  getLocalizedSvgPath(): string {
    return `assets/i18n/${this.locale}/tag_build_system_${this.locale}.drawio.svg`;
  }
}
