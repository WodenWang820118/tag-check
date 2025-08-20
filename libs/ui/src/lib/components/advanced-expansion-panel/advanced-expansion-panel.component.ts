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
  inject
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
import {
  EditorFacadeService,
  EsvEditorService,
  SetupConstructorService
} from '@data-access';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { EditorView } from 'codemirror';
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
  encapsulation: ViewEncapsulation.None
})
export class AdvancedExpansionPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly editorFacadeService = inject(EditorFacadeService);
  private readonly setupConstructorService = inject(SetupConstructorService);
  private readonly esvEditorService = inject(EsvEditorService);
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
    // Setup form subscriptions using signals
    effect(() => {
      const setupFormValue = this.setupFormChanges$();
      if (setupFormValue) {
        this.setupConstructorService.setGoogleTagName(
          setupFormValue.googleTagName ?? ''
        );
        this.setupConstructorService.setMeasurementId(
          setupFormValue.useExistingMeasurementId ?? ''
        );
      }
    });

    // EC and ESV form subscriptions using signals
    effect(() => {
      const ecAndEsvValue = this.ecAndEsvFormChanges$();
      if (ecAndEsvValue) {
        this.setupConstructorService.setIsSendingEcommerceData(
          ecAndEsvValue.isSendingEcommerceData ?? false
        );
      }
    });

    effect(() => {
      const ecAndEsvValue = this.ecAndEsvFormChanges$();
      if (ecAndEsvValue) {
        this.esvEditorService.setEsvContent(ecAndEsvValue.esv ?? '');
      }
    });
  }

  ngOnInit() {
    this.initializeFormSubscriptions(); // inspect the specification JSON and update the form
    // Testing code below to test the custimized GTM Event Settings Variable
    // const esvValue = JSON.stringify(
    //   [
    //     {
    //       name: 'Google Tag G-8HK542DQMG Event Settings',
    //       parameters: [
    //         {
    //           page_referrer: '{{page_referrer for G-8HK542DQMG Tags | String}}'
    //         }
    //       ]
    //     }
    //   ],
    //   null,
    //   2
    // );
    this.setupForm.controls.googleTagName.setValue('GA4 Configuration Tag');
    this.setupForm.controls.useExistingMeasurementId.setValue('');
  }

  private initializeFormSubscriptions(): void {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(() => {
          const editor = this.editorFacadeService.getInputJsonContent()();
          return { editor, form: this.form.getRawValue() };
        }),
        filter(({ editor, form }) => !!editor && !!form),
        catchError((error) => {
          this.handleError('Error processing form changes', error);
          return EMPTY;
        })
      )
      .subscribe(({ editor, form }) => {
        this.handleEditorAndFormChanges(editor, form);
      });
  }

  private handleEditorAndFormChanges(
    editor: EditorView,
    form: AdvancedFormValues
  ): void {
    if (!editor.state.doc.toString()) return;

    try {
      const jsonString = editor.state.doc.toString();
      const json = JSON.parse(jsonString);
      const updatedJson = this.editorFacadeService.updateJsonBasedOnForm(
        json,
        form
      );

      this.editorFacadeService.setInputJsonContent(updatedJson);
      this.setupConstructorService.setIncludeItemScopedVariables(
        form.includeItemScopedVariables
      );
    } catch (error) {
      this.handleError('JSON parsing error', error);
    }
  }

  onPanelOpened(): void {
    const editor = this.editorFacadeService.getInputJsonContent()();
    this.form.patchValue({
      includeVideoTag: this.editorFacadeService.hasVideoTag(editor),
      includeScrollTag: this.editorFacadeService.hasScrollTag(editor)
    });
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.dialog.open(ErrorDialogComponent, {
      data: { message: 'Please check your JSON syntax.' }
    });
  }
}
