import { Component } from '@angular/core';
import { MermaidDiagramComponent } from '../mermaid-diagram/mermaid-diagram.component';

@Component({
  selector: 'lib-objectives',
  standalone: true,
  imports: [MermaidDiagramComponent],
  templateUrl: './objectives.component.html',
  styleUrls: ['./objectives.component.scss']
})
export class ObjectivesComponent {
  readonly tagCheckDiagram = this.buildTagCheckDiagram();
  readonly tagCheckDiagramLabel = $localize`:@@diagram.aria.tag-check:Tag Check workflow: TagBuild outputs GTM JSON that runs on the website; TagCheck monitors GTM and the website against the Specification to surface issues`;

  private buildTagCheckDiagram(): string {
    const spec = $localize`:@@diagram.node.specification:Specification`;
    const ga4 = $localize`:@@diagram.node.ga4events:GA4 Events`;
    const docs = $localize`:@@diagram.node.gtmdocs:GTM Docs`;
    const website = $localize`:@@diagram.node.website:website`;
    const outputsJson = $localize`:@@diagram.edge.outputs-json:Outputs JSON`;
    const definesEvents = $localize`:@@diagram.edge.defines-events:defines events`;
    const runsOn = $localize`:@@diagram.edge.runs-on:runs on`;
    const monitors = $localize`:@@diagram.edge.monitors:monitors`;
    const sources = $localize`:@@diagram.subgraph.sources:Sources`;
    const tagBuild = $localize`:@@diagram.subgraph.tag-build:Tag Build`;

    return `flowchart TD
  subgraph src["${sources}"]
    GA4["${ga4}"]
    Docs["${docs}"]
  end
  subgraph build["${tagBuild}"]
    Spec["${spec}"]
    TB["TagBuild"]
  end
  GTM["GTM"]
  Web["${website}"]
  TC["TagCheck"]
  GA4  --> Spec
  GA4  --> TB
  Docs --> TB
  Spec --> TB
  Spec -->|"${definesEvents}"| TC
  TB   -->|"${outputsJson}"| GTM
  GTM  -->|"${runsOn}"| Web
  GTM  -->|"${monitors}"| TC
  Web  -->|"${monitors}"| TC`;
  }
}
