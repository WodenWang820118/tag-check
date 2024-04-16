import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TagBuildViewComponent } from './views/tag-build-view.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: TagBuildViewComponent,
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TagBuildModule {}
