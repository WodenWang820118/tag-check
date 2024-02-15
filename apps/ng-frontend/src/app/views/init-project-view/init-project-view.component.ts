import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InitProjectFormComponent } from '../../components/init-project-form/init-project-form.component';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProjectService } from '../../services/api/project/project.service';
import { ConfigurationService } from '../../services/api/configuration/configuration.service';
import { MatCardModule } from '@angular/material/card';
import { take, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-init-project-view',
  standalone: true,
  imports: [
    CommonModule,
    InitProjectFormComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <div class="init-project">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Root</mat-card-title>
          <mat-card-subtitle
            >Root folder path for all your projects.</mat-card-subtitle
          >
        </mat-card-header>
        <br />
        <mat-card-content>
          <form class="init-project__config" [formGroup]="configurationForm">
            <mat-form-field>
              <mat-label>Root folder</mat-label>
              <input
                matInput
                placeholder="D:\\projects"
                formControlName="root"
              />
            </mat-form-field>
            <mat-card-actions align="end" style="gap: 1rem">
              <button
                mat-raised-button
                color="warn"
                matTooltip="Reset and configure new root path"
                [matTooltipPosition]="'below'"
                (click)="onResetRoot()"
              >
                Reset
              </button>
              <button
                mat-raised-button
                matTooltip="Save new root path"
                [matTooltipPosition]="'below'"
                (click)="onSaveRoot()"
              >
                Save
              </button>
            </mat-card-actions>
          </form>
        </mat-card-content>
      </mat-card>
      <br />
      <div class="init-project__form">
        <app-init-project-form></app-init-project-form>
      </div>
    </div>
  `,
  styles: `
    .init-project {
      padding: 1rem 10rem;
      &__config {
        display: flex;
        flex-direction: column;
      }
    }
  `,
})
export class InitProjectViewComponent implements OnInit {
  configurationForm = this.fb.group({
    root: ['', Validators.required],
  });
  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
    private configService: ConfigurationService
  ) {}

  ngOnInit() {
    this.configService
      .getConfiguration('rootProjectPath')
      .pipe(
        take(1),
        tap((root) => {
          if (root) {
            this.configurationForm.controls.root.setValue(root.value);
            this.configurationForm.disable();
          }
        })
      )
      .subscribe();
  }

  onResetRoot() {
    // TODO: reset the root configuration to be empty
  }

  onSaveRoot() {
    // TODO: save the root configuration to the database
  }
}
