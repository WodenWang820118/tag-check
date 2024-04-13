import {
  Component,
  ViewEncapsulation,
  AfterViewInit,
  ViewChild,
  OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { tap, combineLatest, take, Subject, takeUntil } from 'rxjs';
import { SharedModule } from '../../shared.module';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { EditorFacadeService } from '../../services/editor-facade/editor-facade.service';
import { SetupConstructorService } from '../../services/setup-constructor/setup-constructor.service';
import { MatAccordion } from '@angular/material/expansion';
import { EditorView } from 'codemirror';

@Component({
  selector: 'app-advanced-expansion-panel',
  standalone: true,
  imports: [SharedModule, ErrorDialogComponent],
  templateUrl: './advanced-expansion-panel.component.html',
  styleUrls: ['./advanced-expansion-panel.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdvancedExpansionPanelComponent implements AfterViewInit {
  form: FormGroup = this.fb.group({
    includeVideoTag: [false],
    includeScrollTag: [false],
    includeItemScopedVariables: [false],
  });

  // TODO: if using existing measurement id, then disable the googleTagName input field
  setupForm: FormGroup = this.fb.group({
    googleTagName: [''],
    useExistingMesurementId: [''],
  });

  @ViewChild(MatAccordion) accordion!: MatAccordion;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private editorFacadeService: EditorFacadeService,
    private setupConstructorService: SetupConstructorService
  ) {}

  ngAfterViewInit() {
    this.onFormChange();
    this.onSetupFormChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // handle forms' observables

  onFormChange() {
    combineLatest([
      this.editorFacadeService.getInputJsonContent(),
      this.form.valueChanges,
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(
          ([editor, form]: [
            EditorView,
            {
              includeVideoTag: boolean;
              includeScrollTag: boolean;
              includeItemScopedVariables: boolean;
            }
          ]) => {
            this.handleEditorAndFormChanges(editor, form);
          }
        )
      )
      .subscribe();
  }

  // TODO: handle control value changes one by one
  onSetupFormChange() {
    this.setupForm.controls['googleTagName'].valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap((googleTagName: string) => {
          if (googleTagName) {
            this.setupConstructorService.setGoogleTagName(googleTagName);
          }
        })
      )
      .subscribe();

    this.setupForm.controls['useExistingMesurementId'].valueChanges
      .pipe(
        tap((useExistingMeasurementId) => {
          if (useExistingMeasurementId) {
            this.setupConstructorService.setMeasurementId(
              useExistingMeasurementId
            );
          }
        })
      )
      .subscribe();
  }

  handleEditorAndFormChanges(
    editor: EditorView,
    form: {
      includeVideoTag: boolean;
      includeScrollTag: boolean;
      includeItemScopedVariables: boolean;
    }
  ) {
    if (!editor.state.doc.toString() || !form) return;

    try {
      const jsonString = editor.state.doc.toString();
      let json = JSON.parse(jsonString);
      const updatedJson = this.editorFacadeService.updateJsonBasedOnForm(
        json,
        form
      );
      this.editorFacadeService.setInputJsonContent(updatedJson);
      this.setupConstructorService.setIncludeItemScopedVariables(
        form.includeItemScopedVariables
      );
    } catch (error) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: 'Please check your JSON syntax.',
        },
      });
    }
  }

  onPanelOpened() {
    // when open the panel, update the form value
    this.editorFacadeService
      .getInputJsonContent()
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        tap((editor: EditorView) => {
          const jsonString = editor.state.doc.toString();

          if (jsonString) {
            const json = JSON.parse(jsonString);

            this.form.patchValue(
              {
                includeVideoTag: this.editorFacadeService.hasVideoTag(json),
                includeScrollTag: this.editorFacadeService.hasScrollTag(json),
              },
              { emitEvent: false }
            );
          }
        })
      )
      .subscribe();
  }
}
