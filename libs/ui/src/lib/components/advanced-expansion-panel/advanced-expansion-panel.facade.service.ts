import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  EditorFacadeService,
  EsvEditorService,
  SetupConstructorService
} from '@data-access';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { EditorView } from 'codemirror';

// Local shape for the simplified form values the component uses
export interface AdvancedFormValues {
  includeVideoTag: boolean;
  includeScrollTag: boolean;
  includeItemScopedVariables: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdvancedExpansionPanelFacade {
  constructor(
    private readonly editorFacadeService: EditorFacadeService,
    private readonly setupConstructorService: SetupConstructorService,
    private readonly esvEditorService: EsvEditorService,
    private readonly dialog: MatDialog
  ) {}

  /**
   * Safely parse the editor JSON, delegate transformation to EditorFacadeService,
   * and wire the resulting content back into the editor facade and setup service.
   * Returns the updated JSON string on success or null on failure.
   */
  updateJsonBasedOnForm(
    editor: EditorView | null | undefined,
    form: AdvancedFormValues
  ): string | null {
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
   * Extracts the patch values (video/scroll tag presence) from the editor using the EditorFacadeService helpers.
   */
  getPatchValuesFromEditor(editor: EditorView | null | undefined): {
    includeVideoTag: boolean;
    includeScrollTag: boolean;
  } {
    if (!editor) return { includeVideoTag: false, includeScrollTag: false };

    return {
      includeVideoTag: this.editorFacadeService.hasVideoTag(editor),
      includeScrollTag: this.editorFacadeService.hasScrollTag(editor)
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
