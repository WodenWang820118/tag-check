import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HelpCenterComponent } from './views/help-center-view.component';

const routes: Routes = [
  {
    path: '',
    component: HelpCenterComponent,
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelpCenterModule {}
