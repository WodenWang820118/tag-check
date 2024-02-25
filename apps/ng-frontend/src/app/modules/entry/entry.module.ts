import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EntryComponent } from './entry.component';
import { HomeViewComponent } from './views/home-view/home-view.component';
import { InitProjectViewComponent } from './views/init-project-view/init-project-view.component';

const routes: Routes = [
  {
    path: 'init-project',
    component: InitProjectViewComponent,
  },
  {
    path: '',
    component: HomeViewComponent,
  },
];

@NgModule({
  imports: [EntryComponent, CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntryModule {}
