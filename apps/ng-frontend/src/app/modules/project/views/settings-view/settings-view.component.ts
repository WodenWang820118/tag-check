import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../../shared/services/api/project/project.service';
import { Subject } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RootFormComponent } from '../../../../shared/components/root-form/root-form.component';
import { ApplicationFormComponent } from '../../../../shared/components/application-form/application-form.component';
import { ProjectInfoFormComponent } from '../../../../shared/components/project-info-form/project-info-form.component';
import { BrowserFormComponent } from '../../../../shared/components/browser-form/browser-form.component';
@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatListModule,
    MatCardModule,
    MatFormFieldModule,
    ToolbarComponent,
    MatInputModule,
    MatGridListModule,
    RootFormComponent,
    ApplicationFormComponent,
    ProjectInfoFormComponent,
    BrowserFormComponent,
  ],
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SettingsViewComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(public projectService: ProjectService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
