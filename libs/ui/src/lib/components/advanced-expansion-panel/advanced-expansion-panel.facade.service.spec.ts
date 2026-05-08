import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  EditorFacadeService,
  EsvEditorService,
  SetupConstructorService
} from '@data-access';
import { AdvancedExpansionPanelFacade } from './advanced-expansion-panel.facade.service';

describe('AdvancedExpansionPanelFacade', () => {
  let svc: AdvancedExpansionPanelFacade;
  let editorFacade: any;
  let setup: any;
  let esv: any;
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    editorFacade = {
      updateJsonBasedOnForm: vi.fn((j: any) => JSON.stringify({ ...j, x: 1 })),
      hasVideoTag: vi.fn(() => true),
      hasScrollTag: vi.fn(() => false),
      inputJsonContent: ''
    };
    setup = {
      setIncludeItemScopedVariables: vi.fn(),
      setGoogleTagName: vi.fn(),
      setMeasurementId: vi.fn(),
      setIsSendingEcommerceData: vi.fn()
    };
    esv = { setEsvContent: vi.fn() };
    dialog = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AdvancedExpansionPanelFacade,
        { provide: EditorFacadeService, useValue: editorFacade },
        { provide: SetupConstructorService, useValue: setup },
        { provide: EsvEditorService, useValue: esv },
        { provide: MatDialog, useValue: dialog }
      ]
    });
    svc = TestBed.inject(AdvancedExpansionPanelFacade);
  });

  function makeEditor(text: string) {
    return { state: { doc: { toString: () => text } } } as never;
  }

  describe('updateJsonBasedOnForm', () => {
    const form = {
      includeVideoTag: true,
      includeScrollTag: true,
      includeItemScopedVariables: true
    };

    it('returns null when editor is missing', () => {
      expect(svc.updateJsonBasedOnForm(null, form)).toBeNull();
    });

    it('returns null when editor doc is empty', () => {
      expect(svc.updateJsonBasedOnForm(makeEditor(''), form)).toBeNull();
    });

    it('parses JSON, applies setup flag and forwards content', () => {
      const out = svc.updateJsonBasedOnForm(makeEditor('{"a":1}'), form);
      expect(typeof out).toBe('string');
      expect(editorFacade.inputJsonContent).toBe(out);
      expect(setup.setIncludeItemScopedVariables).toHaveBeenCalledWith(true);
    });

    it('opens an error dialog and returns null when JSON is invalid', () => {
      const errSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      expect(
        svc.updateJsonBasedOnForm(makeEditor('not-json'), form)
      ).toBeNull();
      expect(dialog.open).toHaveBeenCalled();
      errSpy.mockRestore();
    });
  });

  describe('getPatchValuesFromEditor', () => {
    it('returns false defaults when editor is missing', () => {
      expect(svc.getPatchValuesFromEditor(null)).toEqual({
        includeVideoTag: false,
        includeScrollTag: false
      });
    });

    it('queries the editor facade for tag presence', () => {
      expect(svc.getPatchValuesFromEditor({} as never)).toEqual({
        includeVideoTag: true,
        includeScrollTag: false
      });
    });
  });

  describe('applySetupFormValues', () => {
    it('forwards values, defaulting to empty strings', () => {
      svc.applySetupFormValues({});
      expect(setup.setGoogleTagName).toHaveBeenCalledWith('');
      expect(setup.setMeasurementId).toHaveBeenCalledWith('');
    });

    it('passes through provided values', () => {
      svc.applySetupFormValues({
        googleTagName: 'GT-1',
        useExistingMeasurementId: 'G-1'
      });
      expect(setup.setGoogleTagName).toHaveBeenCalledWith('GT-1');
      expect(setup.setMeasurementId).toHaveBeenCalledWith('G-1');
    });
  });

  describe('applyEcAndEsvFormValues', () => {
    it('forwards ecommerce and ESV values, with defaults', () => {
      svc.applyEcAndEsvFormValues({});
      expect(setup.setIsSendingEcommerceData).toHaveBeenCalledWith(false);
      expect(esv.setEsvContent).toHaveBeenCalledWith('');
    });

    it('uses provided ecommerce/ESV values', () => {
      svc.applyEcAndEsvFormValues({
        isSendingEcommerceData: true,
        isEsv: true,
        esv: '{}'
      });
      expect(setup.setIsSendingEcommerceData).toHaveBeenCalledWith(true);
      expect(esv.setEsvContent).toHaveBeenCalledWith('{}');
    });
  });
});
