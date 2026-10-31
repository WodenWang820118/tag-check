import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { EditorFacadeService } from '@data-access';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { GeneralEditorComponent } from '../general-editor/general-editor.component';
import {
  AdvancedExpansionPanelFacade,
  AdvancedFormValues
} from './advanced-expansion-panel.facade.service';

interface SetupFormValues {
  googleTagName: string;
  useExistingMeasurementId: string;
}

interface EcAndEsvFormValues {
  isSendingEcommerceData: boolean;
  isEsv: boolean;
  esv: string;
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
    FormField,
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
  private readonly dialog = inject(MatDialog);
  private readonly editorFacadeService = inject(EditorFacadeService);
  private readonly facade = inject(AdvancedExpansionPanelFacade);

  readonly formModel = signal<AdvancedFormValues>({
    includeVideoTag: false,
    includeScrollTag: false,
    includeItemScopedVariables: false
  });
  readonly form = form(this.formModel);

  readonly setupFormModel = signal<SetupFormValues>({
    googleTagName: '',
    useExistingMeasurementId: ''
  });
  readonly setupForm = form(this.setupFormModel);

  readonly ecAndEsvFormModel = signal<EcAndEsvFormValues>({
    isSendingEcommerceData: false,
    isEsv: false,
    esv: ''
  });
  readonly ecAndEsvForm = form(this.ecAndEsvFormModel);

  accordion = viewChild.required<MatAccordion>(MatAccordion);

  private isFirstFormChange = true;

  constructor() {
    effect(() => {
      this.facade.applySetupFormValues(this.setupFormModel());
    });

    effect(() => {
      this.facade.applyEcAndEsvFormValues(this.ecAndEsvFormModel());
    });

    effect(() => {
      const values = this.formModel();
      if (this.isFirstFormChange) {
        this.isFirstFormChange = false;
        return;
      }
      untracked(() => {
        try {
          const editor = this.editorFacadeService.editorView.inputJson();
          if (editor?.state.doc.toString()) {
            this.facade.updateJsonBasedOnForm(editor, values);
          }
        } catch (error) {
          this.handleError('Error processing form changes', error);
        }
      });
    });
  }

  ngOnInit(): void {
    this.setupForm.googleTagName().value.set('GA4 Configuration Tag');
    this.setupForm.useExistingMeasurementId().value.set('');
  }

  onPanelOpened(): void {
    const editor = this.editorFacadeService.editorView.inputJson();
    const patch = this.facade.getPatchValuesFromEditor(editor);
    this.formModel.update((current) => ({
      ...current,
      ...patch
    }));
  }

  private handleError(message: string, error: unknown): void {
    // Keep a lightweight wrapper so callers inside this component can still use it.
    console.error(message, error);
    this.dialog.open(ErrorDialogComponent, {
      data: { message: 'Please check your JSON syntax.' }
    });
  }
}
