import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetailViewComponent } from './views/detail-view/detail-view.component';
import { ProjectViewComponent } from './views/project-view/project.component';
import { NewReportViewComponent } from './views/new-report-view/new-report-view.component';
import { SettingsViewComponent } from './views/settings-view/settings.component';
import { ReportViewComponent } from './views/report-view/report-view.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectViewComponent,
    children: [
      {
        path: '',
        component: ReportViewComponent,
      },
      {
        path: 'settings',
        component: SettingsViewComponent,
      },
      {
        path: 'new-report',
        component: NewReportViewComponent,
      },
      {
        path: ':eventName',
        component: DetailViewComponent,
      },
    ],
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectModule {}
