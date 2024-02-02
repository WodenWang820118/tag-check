import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProjectViewComponent } from './project-view.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: ProjectViewComponent,
  },
];

@NgModule({
  imports: [ProjectViewComponent, CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectViewModule {}
