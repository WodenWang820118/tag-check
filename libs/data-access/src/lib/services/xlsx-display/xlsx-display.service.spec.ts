import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { XlsxDisplayService } from './xlsx-display.service';
import { EditorService } from '../../services/editor/editor.service';
import { XlsxHelper } from '../xlsx-facade/xlsx-helper.service';
import { EditorTypeEnum } from '@utils';

describe('XlsxDisplayService', () => {
  let svc: XlsxDisplayService;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let editor: { setContent: ReturnType<typeof vi.fn> };
  let helper: {
    filterNonEmptyData: ReturnType<typeof vi.fn>;
    filterGtmSpecsFromData: ReturnType<typeof vi.fn>;
    convertSpecStringToObject: ReturnType<typeof vi.fn>;
    unfixedableJsonString: string[];
  };

  beforeEach(() => {
    dialog = { open: vi.fn() };
    editor = { setContent: vi.fn() };
    helper = {
      filterNonEmptyData: vi.fn((d) => d),
      filterGtmSpecsFromData: vi.fn(() => ['{"event":"a"}', '{"event":"b"}']),
      convertSpecStringToObject: vi.fn((s) => JSON.parse(s)),
      unfixedableJsonString: []
    };
    TestBed.configureTestingModule({
      providers: [
        XlsxDisplayService,
        { provide: MatDialog, useValue: dialog },
        { provide: EditorService, useValue: editor },
        { provide: XlsxHelper, useValue: helper }
      ]
    });
    svc = TestBed.inject(XlsxDisplayService);
  });

  it('initial signal state is empty / preview-on / not rendering', () => {
    expect(svc.dataSource$()).toEqual([]);
    expect(svc.displayedDataSource$()).toEqual([]);
    expect(svc.displayedColumns$()).toEqual([]);
    expect(svc.displayedFailedEvents$()).toEqual([]);
    expect(svc.isRenderingJson$()).toBe(false);
    expect(svc.isPreviewing$()).toBe(true);
  });

  it('handleReadXlsxAction stores data and updates display', () => {
    svc.handleReadXlsxAction({ jsonData: [{ a: 1, b: 2 }] });
    expect(svc.dataSource$()).toEqual([{ a: 1, b: 2 }]);
    expect(svc.displayedColumns$()).toEqual(['a', 'b']);
  });

  it('handleSwitchSheetAction sets data, displayed and columns', () => {
    svc.handleSwitchSheetAction({ jsonData: [{ x: 1 }] });
    expect(svc.dataSource$()).toEqual([{ x: 1 }]);
    expect(svc.displayedColumns$()).toEqual(['x']);
  });

  it('processSpecs filters parsed specs that have an event', () => {
    helper.filterGtmSpecsFromData.mockReturnValueOnce([
      '{"event":"a"}',
      '{"foo":1}'
    ]);
    const out = svc.processSpecs([] as never);
    expect(out).toEqual([{ event: 'a' }]);
  });

  it('processSpecs opens error dialog when convert throws', () => {
    helper.filterGtmSpecsFromData.mockReturnValueOnce(['bad']);
    helper.convertSpecStringToObject.mockImplementationOnce(() => {
      throw new Error('parse');
    });
    svc.processSpecs([] as never);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('handlePreviewDataAction wraps events as Spec rows and lists failed events', () => {
    helper.unfixedableJsonString = ['oops'];
    svc.handlePreviewDataAction({ jsonData: [] });
    expect(svc.displayedColumns$()).toEqual(['Spec']);
    expect(svc.displayedDataSource$().length).toBeGreaterThan(0);
    expect(svc.displayedFailedEvents$()).toEqual([{ failedEvents: 'oops' }]);
  });

  it('processAndSetSpecsContent forwards stringified events to the editor', () => {
    svc.processAndSetSpecsContent([] as never);
    expect(editor.setContent).toHaveBeenCalledWith(
      EditorTypeEnum.INPUT_JSON,
      expect.any(String)
    );
  });

  it('resetDisplayData restores defaults', () => {
    svc.handleReadXlsxAction({ jsonData: [{ a: 1 }] });
    svc.setIsRenderingJson(true);
    svc.setIsPreviewing(false);
    svc.resetDisplayData();
    expect(svc.dataSource$()).toEqual([]);
    expect(svc.displayedDataSource$()).toEqual([]);
    expect(svc.displayedColumns$()).toEqual([]);
    expect(svc.isRenderingJson$()).toBe(false);
    expect(svc.isPreviewing$()).toBe(true);
    expect(svc.displayedFailedEvents$()).toEqual([]);
  });
});
