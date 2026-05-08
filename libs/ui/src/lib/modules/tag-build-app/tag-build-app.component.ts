import { Component } from '@angular/core';
import { ArticleComponent } from '../../components/article/article.component';
import { XlsxSidenavComponent } from '../../components/xlsx-sidenav/xlsx-sidenav.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import type { StrictDataLayerEvent } from '@utils';
import { TagBuildPageComponent } from '../../views/tag-build-page/tag-build-page.component';

@Component({
  selector: 'lib-tag-build-app',
  standalone: true,
  imports: [
    MatSidenavModule,
    ArticleComponent,
    XlsxSidenavComponent,
    TagBuildPageComponent
  ],
  templateUrl: './tag-build-app.component.html',
  styleUrls: ['./tag-build-app.component.scss']
})
export class TagBuildAppComponent {
  exampleInputJson: StrictDataLayerEvent[] = [];
}
