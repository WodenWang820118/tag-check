import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ArticleComponent } from '../../components/article/article.component';
import type { StrictDataLayerEvent } from '@utils';
import { TagBuildPageComponent } from '../../views/tag-build-page/tag-build-page.component';

@Component({
  selector: 'lib-tag-build-app',
  standalone: true,
  imports: [ArticleComponent, TagBuildPageComponent],
  templateUrl: './tag-build-app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./tag-build-app.component.scss']
})
export class TagBuildAppComponent {
  exampleInputJson: StrictDataLayerEvent[] = [];
}
