import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  Component,
  AfterViewInit,
  OnInit,
  DestroyRef,
  viewChild,
  ViewEncapsulation,
  effect,
  Signal,
  inject
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { combineLatest, take, catchError, EMPTY, filter, map } from 'rxjs';
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
export class AdvancedExpansionPanelComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private editorFacadeService = inject(EditorFacadeService);
  private setupConstructorService = inject(SetupConstructorService);
  private esvEditorService = inject(EsvEditorService);
  private destroyRef = inject(DestroyRef);

  form: FormGroup = this.fb.group({
    includeVideoTag: [false],
    includeScrollTag: [false],
    includeItemScopedVariables: [false]
  });

  setupForm: FormGroup = this.fb.group({
    googleTagName: [''],
    useExistingMesurementId: ['']
  });

  ecAndEsvForm: FormGroup = this.fb.group({
    isSendingEcommerceData: [false],
    isEsv: [false],
    esv: ['']
  });

  accordion = viewChild.required<MatAccordion>(MatAccordion);

  private readonly setupFormChanges$: Signal<{
    googleTagName: string;
    useExistingMesurementId: string;
  }> = toSignal(this.setupForm.valueChanges);
  private readonly ecAndEsvFormChanges$: Signal<{
    isSendingEcommerceData: boolean;
    isEsv: boolean;
    esv: string;
  }> = toSignal(this.ecAndEsvForm.valueChanges);

  constructor() {
    // Setup form subscriptions using signals
    effect(() => {
      const setupFormValue = this.setupFormChanges$();
      if (setupFormValue) {
        this.setupConstructorService.setGoogleTagName(
          setupFormValue.googleTagName
        );
        this.setupConstructorService.setMeasurementId(
          setupFormValue.useExistingMesurementId
        );
      }
    });

    // EC and ESV form subscriptions using signals
    effect(() => {
      const ecAndEsvValue = this.ecAndEsvFormChanges$();
      if (ecAndEsvValue) {
        this.setupConstructorService.setIsSendingEcommerceData(
          ecAndEsvValue.isSendingEcommerceData
        );
      }
    });

    effect(() => {
      const ecAndEsvValue = this.ecAndEsvFormChanges$();
      if (ecAndEsvValue) {
        this.esvEditorService.setEsvContent(ecAndEsvValue.esv);
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

    // this.ecAndEsvForm.patchValue({ esv: esvValue });
  }

  ngAfterViewInit() {
    this.setupForm.controls['googleTagName'].setValue('GA4 Configuration Tag');
  }

  private initializeFormSubscriptions(): void {
    // Handle main form changes
    combineLatest([
      this.editorFacadeService.getInputJsonContent(),
      this.form.valueChanges
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(([editor, form]) => !!editor && !!form),
        map(([editor, form]) => ({ editor, form })),
        catchError((error) => {
          this.handleError('Error processing form changes', error);
          return EMPTY;
        })
      )
      .subscribe(({ editor, form }) => {
        this.handleEditorAndFormChanges(editor, form);
      });
  }

  private handleEditorAndFormChanges(editor: EditorView, form: any): void {
    if (!editor.state.doc.toString() || !form) return;

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
    this.editorFacadeService
      .getInputJsonContent()
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        filter((editor) => !!editor?.state?.doc?.toString()),
        map((editor) => JSON.parse(editor.state.doc.toString())),
        catchError((error) => {
          this.handleError('Error opening panel', error);
          return EMPTY;
        })
      )
      .subscribe((json) => {
        this.form.patchValue(
          {
            includeVideoTag: this.editorFacadeService.hasVideoTag(json),
            includeScrollTag: this.editorFacadeService.hasScrollTag(json)
          },
          { emitEvent: false }
        );
      });
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.dialog.open(ErrorDialogComponent, {
      data: { message: 'Please check your JSON syntax.' }
    });
  }
}
