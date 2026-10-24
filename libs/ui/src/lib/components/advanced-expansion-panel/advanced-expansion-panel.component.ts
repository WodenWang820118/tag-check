import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  Component,
  OnInit,
  DestroyRef,
  viewChild,
  ViewEncapsulation,
  effect,
  Signal,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormControl
} from '@angular/forms';
import { catchError, EMPTY, filter, map } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { EditorFacadeService } from '@data-access';
import { AdvancedExpansionPanelFacade } from './advanced-expansion-panel.facade.service';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GeneralEditorComponent } from '../general-editor/general-editor.component';

// Define the shape of the main form values
interface AdvancedFormValues {
  includeVideoTag: boolean;
  includeScrollTag: boolean;
  includeItemScopedVariables: boolean;
}

/**
 * tag-build's advanced options: built-in scroll and video events, the
 * Google tag setup, ecommerce data and Event Settings variables.
 */
@Component({
  selector: 'lib-advanced-expansion-panel',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    GeneralEditorComponent
  ],
  templateUrl: './advanced-expansion-panel.component.html',
  styleUrls: ['./advanced-expansion-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class AdvancedExpansionPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly editorFacadeService = inject(EditorFacadeService);
  private readonly facade = inject(AdvancedExpansionPanelFacade);
  private readonly destroyRef = inject(DestroyRef);

  form: FormGroup = this.fb.group({
    includeVideoTag: [false],
    includeScrollTag: [false],
    includeItemScopedVariables: [false]
  });

  setupForm: FormGroup<{
    googleTagName: FormControl<string | null>;
    useExistingMeasurementId: FormControl<string | null>;
  }> = this.fb.group({
    googleTagName: [''],
    useExistingMeasurementId: ['']
  });

  ecAndEsvForm: FormGroup = this.fb.group({
    isSendingEcommerceData: [false],
    isEsv: [false],
    esv: ['']
  });

  accordion = viewChild.required<MatAccordion>(MatAccordion);

  private readonly setupFormChanges$: Signal<
    Partial<{
      googleTagName: string | null;
      useExistingMeasurementId: string | null;
    }>
  > = toSignal(this.setupForm.valueChanges, {
    initialValue: this.setupForm.getRawValue()
  });
  private readonly ecAndEsvFormChanges$: Signal<
    Partial<{
      isSendingEcommerceData: boolean;
      isEsv: boolean;
      esv: string;
    }>
  > = toSignal(this.ecAndEsvForm.valueChanges, {
    initialValue: this.ecAndEsvForm.getRawValue()
  });

  constructor() {
    // Setup form subscriptions using signals - delegate to facade
    effect(() => {
      const setupFormValue = this.setupFormChanges$();
      if (setupFormValue) {
        this.facade.applySetupFormValues(setupFormValue);
      }
    });

    // EC and ESV form subscriptions using signals - delegate to facade
    effect(() => {
      const ecAndEsvValue = this.ecAndEsvFormChanges$();
      if (ecAndEsvValue) {
        this.facade.applyEcAndEsvFormValues(ecAndEsvValue);
      }
    });
  }

  ngOnInit() {
    this.initializeFormSubscriptions(); // inspect the specification JSON and update the form
    this.setupForm.controls.googleTagName.setValue('GA4 Configuration Tag');
    this.setupForm.controls.useExistingMeasurementId.setValue('');
  }

  private initializeFormSubscriptions(): void {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(() => {
          const editor = this.editorFacadeService.editorView.inputJson();
          return { editor, form: this.form.getRawValue() };
        }),
        filter(({ editor, form }) => !!editor && !!form),
        catchError((error) => {
          this.handleError('Error processing form changes', error);
          return EMPTY;
        })
      )
      .subscribe(({ editor, form }) => {
        // Delegate the heavy lifting to the facade which returns the updated JSON or null on error
        this.facade.updateJsonBasedOnForm(editor, form as AdvancedFormValues);
      });
  }

  onPanelOpened(): void {
    const editor = this.editorFacadeService.editorView.inputJson();
    const patch = this.facade.getPatchValuesFromEditor(editor);
    this.form.patchValue(patch);
  }

  private handleError(message: string, error: unknown): void {
    // Keep a lightweight wrapper so callers inside this component can still use it.
    console.error(message, error);
    this.dialog.open(ErrorDialogComponent, {
      data: { message: 'Please check your JSON syntax.' }
    });
  }
}
