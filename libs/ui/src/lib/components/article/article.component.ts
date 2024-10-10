import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'lib-article',
  standalone: true,
  template: `<div class="article">
    <div class="article__purpose"></div>
    <div class="article__usage">
      <h1>Usage</h1>
      <p>
        Tag Build aims to save users' time and increase their productivity by
        automating the GTM (Google Tag Manager) configuration process. This is
        especially beneficial for digital marketers, web developers, and SEO
        experts who need to manage and track multiple website tags, enabling
        them to focus more on data analysis rather than tag implementations.
      </p>
      <p>The expected input is an array of objects:</p>
      <pre>{{ exampleInput | json }}</pre>
      <div></div>
      <p>
        Note that the dollar sign "$" is intended to refer to variables that can
        be referenced in the document or specifications. You can replace the
        "$variable_name" placeholders with actual values, or leave them empty.
      </p>
    </div>
  </div> `,
  styles: [],
  imports: [JsonPipe],
})
export class ArticleComponent {
  exampleInput = [
    {
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
            item_variant: '$item_variant',
          },
        ],
      },
    },
  ];
}
