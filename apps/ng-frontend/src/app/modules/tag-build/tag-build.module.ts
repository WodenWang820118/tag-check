import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TagBuildViewComponent } from './views/tag-build-view.component';
import { RouterModule, Routes } from '@angular/router';

const TAG_BUILD_ROUTES: Routes = [
  {
    path: '',
    component: TagBuildViewComponent,
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(TAG_BUILD_ROUTES)],
  exports: [RouterModule],
})
export class TagBuildModule {}
