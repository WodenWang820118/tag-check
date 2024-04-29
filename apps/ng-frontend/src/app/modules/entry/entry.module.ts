import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EntryComponent } from './entry.component';
import { HomeViewComponent } from './views/home-view/home-view.component';
import { InitProjectViewComponent } from './views/init-project-view/init-project-view.component';
import { GlobalSettingsViewComponent } from './views/global-settings-view/global-settings-view.component';

const ENTRY_ROUTES: Routes = [
  {
    path: 'init-project',
    component: InitProjectViewComponent,
  },
  {
    path: 'global-settings',
    component: GlobalSettingsViewComponent,
  },
  {
    path: '',
    component: HomeViewComponent,
  },
];

@NgModule({
  imports: [EntryComponent, CommonModule, RouterModule.forChild(ENTRY_ROUTES)],
  exports: [RouterModule],
})
export class EntryModule {}
