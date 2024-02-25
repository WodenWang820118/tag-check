import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProjectComponent } from './project.component';
import { RouterModule, Routes } from '@angular/router';
import { DetailViewComponent } from './views/detail-view/detail-view.component';
import { ProjectViewComponent } from './views/project-view/project.component';
import { NewReportViewComponent } from './views/new-report-view/new-report-view.component';

const routes: Routes = [
  {
    path: 'new-report',
    component: NewReportViewComponent,
  },
  {
    path: '',
    component: ProjectComponent,
    children: [
      {
        path: '',
        component: ProjectViewComponent,
      },
      {
        path: ':eventName',
        component: DetailViewComponent,
      },
    ],
  },
];

@NgModule({
  imports: [ProjectComponent, CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectModule {}
