import { Component } from '@angular/core';
import { EditorComponent } from '../editor/editor.component';
import { FunctionalCardComponent } from '../functional-card/functional-card.component';
import { ArticleComponent } from '../article/article.component';
import { FooterComponent } from '../footer/footer.component';
import { XlsxSidenavComponent } from '../xlsx-sidenav/xlsx-sidenav.component';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    SharedModule,
    EditorComponent,
    FunctionalCardComponent,
    ArticleComponent,
    FooterComponent,
    XlsxSidenavComponent
],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
  exampleInputJson = ['Please input your JSON data or try JS object here'];
}
