import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MermaidDiagramComponent } from '../mermaid-diagram/mermaid-diagram.component';

@Component({
  selector: 'lib-about',
  standalone: true,
  imports: [JsonPipe, MermaidDiagramComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  readonly tagBuildDiagram = this.buildTagBuildDiagram();
  readonly tagBuildDiagramLabel = $localize`:@@diagram.aria.tag-build:Tag Build workflow: GA4 Events and GTM Docs feed into Specification and TagBuild to produce GTM output`;

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

  private buildTagBuildDiagram(): string {
    const spec = $localize`:@@diagram.node.specification:Specification`;
    const ga4 = $localize`:@@diagram.node.ga4events:GA4 Events`;
    const docs = $localize`:@@diagram.node.gtmdocs:GTM Docs`;
    const outputsJson = $localize`:@@diagram.edge.outputs-json:Outputs JSON`;
    const sources = $localize`:@@diagram.subgraph.sources:Sources`;
    const tagBuild = $localize`:@@diagram.subgraph.tag-build:Tag Build`;

    return `flowchart TD
  subgraph src["${sources}"]
    GA4["${ga4}"]
    Docs["${docs}"]
  end
  subgraph proc["${tagBuild}"]
    Spec["${spec}"]
    TB["TagBuild"]
  end
  GTM["GTM"]
  GA4  --> Spec
  GA4  --> TB
  Docs --> TB
  Spec --> TB
  TB   -->|"${outputsJson}"| GTM`;
  }
}
