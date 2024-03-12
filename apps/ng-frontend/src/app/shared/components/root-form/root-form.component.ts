import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfigurationService } from '../../services/api/configuration/configuration.service';

@Component({
  selector: 'app-root-form',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Root</mat-card-title>
        <mat-card-subtitle
          >Root folder path for all your projects.</mat-card-subtitle
        >
      </mat-card-header>
      <br />
      <mat-card-content>
        <form [formGroup]="rootForm">
          <mat-form-field appearance="outline">
            <mat-label>Root folder</mat-label>
            <input matInput placeholder="D:\\projects" formControlName="name" />
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
            <button mat-raised-button color="primary" (click)="onFormSubmit()">
              Save
            </button>
          </mat-card-actions>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [''],
  encapsulation: ViewEncapsulation.None,
})
export class RootFormComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  rootForm = this.fb.group({
    name: [''],
  });

  constructor(
    private fb: FormBuilder,
    private configurationService: ConfigurationService
  ) {}

  onResetRoot() {
    this.configurationService
      .resetConfiguration('rootProjectPath')
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.rootForm.reset();
          this.rootForm.enable();
        })
      )
      .subscribe();
  }

  onFormSubmit() {
    const value = this.rootForm.controls.name.value;
    if (!value) {
      return;
    }
    this.configurationService
      .createConfiguration({
        name: 'rootProjectPath',
        value: value,
      })
      .pipe(
        takeUntil(this.destroy$),
        tap((res) => {
          console.log('res', res);
          this.rootForm.disable();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
