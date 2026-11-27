import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { EditorFacadeService } from '@data-access';
import { EditorView } from 'codemirror';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdvancedExpansionPanelComponent } from './advanced-expansion-panel.component';
import { AdvancedExpansionPanelFacade } from './advanced-expansion-panel.facade.service';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

describe('AdvancedExpansionPanelComponent', () => {
  let fixture: ComponentFixture<AdvancedExpansionPanelComponent>;
  let component: AdvancedExpansionPanelComponent;
  let facade: {
    applySetupFormValues: ReturnType<typeof vi.fn>;
    applyEcAndEsvFormValues: ReturnType<typeof vi.fn>;
    updateJsonBasedOnForm: ReturnType<typeof vi.fn>;
    getPatchValuesFromEditor: ReturnType<typeof vi.fn>;
  };
  let editorViewSignal: WritableSignal<EditorView | null>;
  let dialog: { open: ReturnType<typeof vi.fn> };

  function makeEditor(text: string): EditorView {
    return {
      state: {
        doc: {
          toString: () => text
        }
      }
    } as unknown as EditorView;
  }

  beforeEach(async () => {
    facade = {
      applySetupFormValues: vi.fn(),
      applyEcAndEsvFormValues: vi.fn(),
      updateJsonBasedOnForm: vi.fn(),
      getPatchValuesFromEditor: vi.fn(() => ({
        includeVideoTag: false,
        includeScrollTag: false
      }))
    };
    editorViewSignal = signal<EditorView | null>(null);
    dialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdvancedExpansionPanelComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AdvancedExpansionPanelFacade, useValue: facade },
        {
          provide: EditorFacadeService,
          useValue: {
            editorView: {
              inputJson: editorViewSignal
            }
          }
        },
        { provide: MatDialog, useValue: dialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedExpansionPanelComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization and start behaviour', () => {
    it('does not call updateJsonBasedOnForm on start even with non-empty editor', () => {
      editorViewSignal.set(makeEditor('{"events": []}'));
      fixture.detectChanges();

      expect(facade.updateJsonBasedOnForm).not.toHaveBeenCalled();
    });

    it('sets googleTagName and useExistingMeasurementId in ngOnInit', () => {
      fixture.detectChanges();

      expect(component.setupForm.googleTagName().value()).toBe(
        'GA4 Configuration Tag'
      );
      expect(component.setupForm.useExistingMeasurementId().value()).toBe('');
      expect(facade.applySetupFormValues).toHaveBeenCalledWith(
        expect.objectContaining({
          googleTagName: 'GA4 Configuration Tag',
          useExistingMeasurementId: ''
        })
      );
    });

    it('forwards initial ecAndEsvForm values to facade on start', () => {
      fixture.detectChanges();

      expect(facade.applyEcAndEsvFormValues).toHaveBeenCalledWith({
        isSendingEcommerceData: false,
        isEsv: false,
        esv: ''
      });
    });
  });

  describe('setupForm and ecAndEsvForm changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
      facade.applySetupFormValues.mockClear();
      facade.applyEcAndEsvFormValues.mockClear();
    });

    it('forwards setupForm values when controls change', () => {
      component.setupForm.googleTagName().value.set('Custom GA4 Tag');
      TestBed.tick();

      expect(facade.applySetupFormValues).toHaveBeenCalledWith(
        expect.objectContaining({
          googleTagName: 'Custom GA4 Tag',
          useExistingMeasurementId: ''
        })
      );

      component.setupForm.useExistingMeasurementId().value.set('G-12345');
      TestBed.tick();

      expect(facade.applySetupFormValues).toHaveBeenCalledWith(
        expect.objectContaining({
          googleTagName: 'Custom GA4 Tag',
          useExistingMeasurementId: 'G-12345'
        })
      );
    });

    it('forwards ecAndEsvForm values when controls change', () => {
      component.ecAndEsvForm.isSendingEcommerceData().value.set(true);
      TestBed.tick();

      expect(facade.applyEcAndEsvFormValues).toHaveBeenCalledWith(
        expect.objectContaining({
          isSendingEcommerceData: true,
          isEsv: false,
          esv: ''
        })
      );

      component.ecAndEsvForm.isEsv().value.set(true);
      component.ecAndEsvForm.esv().value.set('{"param": "val"}');
      TestBed.tick();

      expect(facade.applyEcAndEsvFormValues).toHaveBeenCalledWith(
        expect.objectContaining({
          isSendingEcommerceData: true,
          isEsv: true,
          esv: '{"param": "val"}'
        })
      );
    });
  });

  describe('main form change handling', () => {
    it('calls updateJsonBasedOnForm when main form changes after start and editor is non-empty', () => {
      const editor = makeEditor('{"test": true}');
      editorViewSignal.set(editor);
      fixture.detectChanges();
      expect(facade.updateJsonBasedOnForm).not.toHaveBeenCalled();

      component.form.includeVideoTag().value.set(true);
      TestBed.tick();

      expect(facade.updateJsonBasedOnForm).toHaveBeenCalledWith(editor, {
        includeVideoTag: true,
        includeScrollTag: false,
        includeItemScopedVariables: false
      });
    });

    it('does not call updateJsonBasedOnForm when editor is missing or empty', () => {
      fixture.detectChanges();

      component.form.includeVideoTag().value.set(true);
      TestBed.tick();
      expect(facade.updateJsonBasedOnForm).not.toHaveBeenCalled();

      editorViewSignal.set(makeEditor(''));
      component.form.includeScrollTag().value.set(true);
      TestBed.tick();
      expect(facade.updateJsonBasedOnForm).not.toHaveBeenCalled();
    });

    it('does not react to editor changes even when the facade reads the editor signal', () => {
      editorViewSignal.set(makeEditor('{"events": []}'));
      facade.updateJsonBasedOnForm.mockImplementation(() => editorViewSignal());
      fixture.detectChanges();

      component.form.includeVideoTag().value.set(true);
      TestBed.tick();
      expect(facade.updateJsonBasedOnForm).toHaveBeenCalledTimes(1);

      editorViewSignal.set(makeEditor('{"events": [{"event": "login"}]}'));
      TestBed.tick();

      expect(facade.updateJsonBasedOnForm).toHaveBeenCalledTimes(1);
    });

    it('handles editor read errors and continues processing later form changes', () => {
      const editor = makeEditor('{"events": []}');
      const error = new Error('Failed to read editor');
      vi.spyOn(editor.state.doc, 'toString').mockImplementationOnce(() => {
        throw error;
      });
      editorViewSignal.set(editor);
      fixture.detectChanges();
      const errSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      component.form.includeVideoTag().value.set(true);
      expect(() => TestBed.tick()).not.toThrow();

      expect(errSpy).toHaveBeenCalledWith(
        'Error processing form changes',
        error
      );
      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: { message: 'Please check your JSON syntax.' }
      });
      expect(facade.updateJsonBasedOnForm).not.toHaveBeenCalled();

      component.form.includeScrollTag().value.set(true);
      TestBed.tick();
      expect(facade.updateJsonBasedOnForm).toHaveBeenCalledWith(editor, {
        includeVideoTag: true,
        includeScrollTag: true,
        includeItemScopedVariables: false
      });
    });

    it('catches errors during form changes and opens error dialog', () => {
      const editor = makeEditor('{"test": true}');
      editorViewSignal.set(editor);
      fixture.detectChanges();

      const errSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      facade.updateJsonBasedOnForm.mockImplementationOnce(() => {
        throw new Error('Failed to update json');
      });

      component.form.includeVideoTag().value.set(true);
      TestBed.tick();

      expect(dialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
        data: { message: 'Please check your JSON syntax.' }
      });
      errSpy.mockRestore();
    });
  });

  describe('onPanelOpened', () => {
    it('patches main form with patch semantics and triggers updateJsonBasedOnForm', () => {
      const editor = makeEditor('{"events": []}');
      editorViewSignal.set(editor);
      fixture.detectChanges();

      facade.getPatchValuesFromEditor.mockReturnValueOnce({
        includeVideoTag: true,
        includeScrollTag: true
      });

      component.formModel.update((current) => ({
        ...current,
        includeItemScopedVariables: true
      }));
      TestBed.tick();
      facade.updateJsonBasedOnForm.mockClear();

      component.onPanelOpened();
      TestBed.tick();

      expect(facade.getPatchValuesFromEditor).toHaveBeenCalledWith(editor);
      expect(component.formModel()).toEqual({
        includeVideoTag: true,
        includeScrollTag: true,
        includeItemScopedVariables: true
      });
      expect(facade.updateJsonBasedOnForm).toHaveBeenCalledWith(editor, {
        includeVideoTag: true,
        includeScrollTag: true,
        includeItemScopedVariables: true
      });
    });
  });
});
