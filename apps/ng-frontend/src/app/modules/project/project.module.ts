import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProjectComponent } from './project.component';
import { RouterModule, Routes } from '@angular/router';
import { DetailViewComponent } from '../../views/detail-view/detail-view.component';
import { ProjectViewComponent } from '../../views/project-view/project.component';

const routes: Routes = [
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
      // You can add more child routes here if needed
    ],
  },
];

@NgModule({
  imports: [ProjectComponent, CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectModule {}
