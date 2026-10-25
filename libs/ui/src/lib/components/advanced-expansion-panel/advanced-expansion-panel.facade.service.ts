import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  EditorFacadeService,
  EsvEditorService,
  SetupConstructorService
} from '@data-access';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { EditorView } from 'codemirror';

/** The advanced options form: built-in events and item-scoped variables. */
export interface AdvancedFormValues {
  includeVideoTag: boolean;
  includeScrollTag: boolean;
  includeItemScopedVariables: boolean;
}

/**
 * Applies tag-build's advanced options panel to the editors and the setup
 * services.
 */
@Injectable({ providedIn: 'root' })
export class AdvancedExpansionPanelFacade {
  constructor(
    private readonly editorFacadeService: EditorFacadeService,
    private readonly setupConstructorService: SetupConstructorService,
    private readonly esvEditorService: EsvEditorService,
    private readonly dialog: MatDialog
  ) {}

  /**
   * Parses the input editor's specs, adds or removes the built-in events the
   * options ask for and shows the result in the editor. Returns the updated
   * specs, or null when the editor is empty or its JSON does not parse (an
   * error dialog is shown for the latter).
   */
  updateJsonBasedOnForm(
    editor: EditorView | null | undefined,
    form: AdvancedFormValues
  ): unknown {
    if (!editor?.state.doc.toString()) return null;

    try {
      const jsonString = editor.state.doc.toString();
      const json = JSON.parse(jsonString);
      const updatedJson = this.editorFacadeService.updateJsonBasedOnForm(
        json,
        form
      );

      this.editorFacadeService.inputJsonContent = updatedJson;
      this.setupConstructorService.setIncludeItemScopedVariables(
        form.includeItemScopedVariables
      );

      return updatedJson;
    } catch (error) {
      this.handleError('JSON parsing error', error);
      return null;
    }
  }

  /**
   * Whether the input editor's specs already contain video and scroll
   * events, to check the matching options. Missing editors and specs that do
   * not parse give false for both.
   */
  getPatchValuesFromEditor(editor: EditorView | null | undefined): {
    includeVideoTag: boolean;
    includeScrollTag: boolean;
  } {
    if (!editor) return { includeVideoTag: false, includeScrollTag: false };

    let json: unknown = null;
    try {
      json = JSON.parse(editor.state.doc.toString());
    } catch {
      // Unparsable specs contain no built-in events to report.
    }

    return {
      includeVideoTag: this.editorFacadeService.hasVideoTag(json),
      includeScrollTag: this.editorFacadeService.hasScrollTag(json)
    };
  }

  /**
   * Apply setup form values to the SetupConstructorService.
   */
  applySetupFormValues(
    value: Partial<{
      googleTagName: string | null;
      useExistingMeasurementId: string | null;
    }>
  ): void {
    this.setupConstructorService.setGoogleTagName(value.googleTagName ?? '');
    this.setupConstructorService.setMeasurementId(
      value.useExistingMeasurementId ?? ''
    );
  }

  /**
   * Apply ecommerce / ESV form values to the appropriate services.
   */
  applyEcAndEsvFormValues(
    value: Partial<{
      isSendingEcommerceData: boolean;
      isEsv: boolean;
      esv: string;
    }>
  ): void {
    this.setupConstructorService.setIsSendingEcommerceData(
      value.isSendingEcommerceData ?? false
    );
    this.esvEditorService.setEsvContent(value.esv ?? '');
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
    this.dialog.open(ErrorDialogComponent, {
      data: { message: 'Please check your JSON syntax.' }
    });
  }
}
