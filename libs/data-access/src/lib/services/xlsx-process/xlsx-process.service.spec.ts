import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { XlsxProcessService } from './xlsx-process.service';
import { WebWorkerService } from '../../services/web-worker/web-worker.service';
import { WorkbookService } from '../workbook/workbook.service';
import { XlsxDisplayService } from '../xlsx-display/xlsx-display.service';
import { FileService } from '../file/file.service';

describe('XlsxProcessService', () => {
  let svc: XlsxProcessService;
  let worker$: Subject<any>;
  let webWorker: {
    postMessage: ReturnType<typeof vi.fn>;
    onMessage: ReturnType<typeof vi.fn>;
  };
  let file: { loadFile: ReturnType<typeof vi.fn> };
  let workbook: {
    setFileName: ReturnType<typeof vi.fn>;
    handleReadXlsxAction: ReturnType<typeof vi.fn>;
    resetWorkbookData: ReturnType<typeof vi.fn>;
  };
  let display: {
    handleReadXlsxAction: ReturnType<typeof vi.fn>;
    handleSwitchSheetAction: ReturnType<typeof vi.fn>;
    handlePreviewDataAction: ReturnType<typeof vi.fn>;
    processAndSetSpecsContent: ReturnType<typeof vi.fn>;
    resetDisplayData: ReturnType<typeof vi.fn>;
    dataSource$: ReturnType<typeof vi.fn>;
    displayedDataSource$: ReturnType<typeof vi.fn>;
    isRenderingJson$: ReturnType<typeof vi.fn>;
    setIsRenderingJson: ReturnType<typeof vi.fn>;
    isPreviewing$: ReturnType<typeof vi.fn>;
    setIsPreviewing: ReturnType<typeof vi.fn>;
    displayedFailedEvents$: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    worker$ = new Subject<any>();
    webWorker = {
      postMessage: vi.fn(),
      onMessage: vi.fn(() => worker$.asObservable())
    };
    file = { loadFile: vi.fn() };
    workbook = {
      setFileName: vi.fn(),
      handleReadXlsxAction: vi.fn(),
      resetWorkbookData: vi.fn()
    };
    display = {
      handleReadXlsxAction: vi.fn(),
      handleSwitchSheetAction: vi.fn(),
      handlePreviewDataAction: vi.fn(),
      processAndSetSpecsContent: vi.fn(),
      resetDisplayData: vi.fn(),
      dataSource$: vi.fn(() => [1, 2, 3]),
      displayedDataSource$: vi.fn(() => [1, 2]),
      isRenderingJson$: vi.fn(() => false),
      setIsRenderingJson: vi.fn(),
      isPreviewing$: vi.fn(() => true),
      setIsPreviewing: vi.fn(),
      displayedFailedEvents$: vi.fn(() => ['e1'])
    };
    TestBed.configureTestingModule({
      providers: [
        XlsxProcessService,
        { provide: WebWorkerService, useValue: webWorker },
        { provide: FileService, useValue: file },
        { provide: WorkbookService, useValue: workbook },
        { provide: XlsxDisplayService, useValue: display }
      ]
    });
    svc = TestBed.inject(XlsxProcessService);
  });

  it('loadXlsxFile reads the file, posts readXlsx and stores filename', async () => {
    file.loadFile.mockImplementationOnce(() => of('binary'));
    await svc.loadXlsxFile({ name: 'a.xlsx' } as never);
    expect(file.loadFile).toHaveBeenCalled();
    expect(webWorker.postMessage).toHaveBeenCalledWith('message', {
      action: 'readXlsx',
      data: 'binary'
    });
    expect(workbook.setFileName).toHaveBeenCalledWith('a.xlsx');
  });

  it('loadXlsxFile swallows file errors via console.error', async () => {
    const err = new Error('nope');
    file.loadFile.mockImplementationOnce(() => throwError(() => err));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await svc.loadXlsxFile({ name: 'b.xlsx' } as never);
    expect(spy).toHaveBeenCalledWith(err);
    spy.mockRestore();
  });

  it('routes worker readXlsx messages to workbook and display', () => {
    svc.initializeDataProcessing();
    worker$.next({ action: 'readXlsx', payload: 1 });
    expect(workbook.handleReadXlsxAction).toHaveBeenCalled();
    expect(display.handleReadXlsxAction).toHaveBeenCalled();
  });

  it('routes switchSheet, previewData and extractSpecs to display', () => {
    svc.initializeDataProcessing();
    worker$.next({ action: 'switchSheet' });
    worker$.next({ action: 'previewData' });
    worker$.next({ action: 'extractSpecs', jsonData: { x: 1 } });
    expect(display.handleSwitchSheetAction).toHaveBeenCalled();
    expect(display.handlePreviewDataAction).toHaveBeenCalled();
    expect(display.processAndSetSpecsContent).toHaveBeenCalledWith({ x: 1 });
  });

  it('exposes counts from display service', () => {
    expect(svc.getNumTotalEvents()).toBe(3);
    expect(svc.getNumParsedEvents()).toBe(2);
  });

  it('proxies isRenderingJson, isPreviewing and displayedFailedEvents getters/setters', () => {
    expect(svc.isRenderingJson).toBe(false);
    svc.setIsRenderingJson(true);
    expect(display.setIsRenderingJson).toHaveBeenCalledWith(true);
    expect(svc.isPreviewing).toBe(true);
    svc.setIsPreviewing(false);
    expect(display.setIsPreviewing).toHaveBeenCalledWith(false);
    expect(svc.displayedFailedEvents).toEqual(['e1']);
  });

  it('resetAllData resets workbook and display', () => {
    svc.resetAllData();
    expect(workbook.resetWorkbookData).toHaveBeenCalled();
    expect(display.resetDisplayData).toHaveBeenCalled();
  });

  it('ngOnDestroy unsubscribes the worker stream', () => {
    svc.initializeDataProcessing();
    svc.ngOnDestroy();
    worker$.next({ action: 'readXlsx' });
    // After destroy, subscription is closed, so no further calls beyond pre-destroy state
    expect(workbook.handleReadXlsxAction).not.toHaveBeenCalled();
  });
});
