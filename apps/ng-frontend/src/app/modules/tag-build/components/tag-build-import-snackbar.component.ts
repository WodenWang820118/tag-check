import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  inject
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
  MatSnackBarRef
} from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

/** What Tag Build shows after a container is imported into the project. */
export interface TagBuildImportSnackbarData {
  /** Created, updated, renamed, kept both, unchanged and skipped counts. */
  message: string;
  /** Absolute path of the project's Tests page. */
  testsLink: string;
}

/**
 * The import result, with a link to the Tests page. The snackbar stays
 * until the link or Close is used, so the counts can be read first.
 */
@Component({
  selector: 'app-tag-build-import-snackbar',
  standalone: true,
  imports: [
    MatButtonModule,
    RouterLink,
    MatSnackBarLabel,
    MatSnackBarActions,
    MatSnackBarAction
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="message" matSnackBarLabel>{{ data.message }}</span>
    <span matSnackBarActions>
      <a
        mat-button
        matSnackBarAction
        data-testid="tagbuild-import-tests"
        [routerLink]="data.testsLink"
      >
        Tests
      </a>
      <button mat-button type="button" (click)="snackBarRef.dismiss()">
        Close
      </button>
    </span>
  `,
  styles: `
    :host {
      display: flex;
    }

    .message {
      color: white;
    }
  `
})
export class TagBuildImportSnackbarComponent {
  snackBarRef = inject(MatSnackBarRef);
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: TagBuildImportSnackbarData
  ) {}
}
