import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HelpCenterComponent } from './views/help-center-view.component';
import { MainContentComponent } from './components/main-content/main-content.component';
import { MarkdownModule } from 'ngx-markdown';

const routes: Routes = [
  {
    path: '',
    component: HelpCenterComponent,
    children: [
      {
        path: ':name',
        component: MainContentComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MarkdownModule.forRoot(),
  ],
  exports: [RouterModule],
})
export class HelpCenterModule {}
