import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { of, throwError } from 'rxjs';
import { XlsxProcessFacade } from './xlsx-facade.service';
import { XlsxProcessService } from '../xlsx-process/xlsx-process.service';
import { WebWorkerService } from '../web-worker/web-worker.service';

describe('XlsxProcessFacade', () => {
  let svc: XlsxProcessFacade;
  let xlsx: any;
  let worker: { postMessage: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    xlsx = {
      setIsPreviewing: vi.fn(),
      setIsRenderingJson: vi.fn(),
      resetAllData: vi.fn(),
      loadXlsxFile: vi.fn().mockResolvedValue(undefined),
      getNumTotalEvents: vi.fn(() => 5),
      getNumParsedEvents: vi.fn(() => 3),
      isRenderingJson: true,
      isPreviewing: false,
      xlsxDisplayService: {
        dataSource$: of({ x: 1 }),
        displayedDataSource$: vi.fn(() => of({ y: 2 }))
      },
      workbookService: { workbook$: vi.fn() }
    };
    worker = { postMessage: vi.fn() };
    dialog = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        XlsxProcessFacade,
        { provide: XlsxProcessService, useValue: xlsx },
        { provide: WebWorkerService, useValue: worker },
        { provide: Dialog, useValue: dialog }
      ]
    });
    svc = TestBed.inject(XlsxProcessFacade);
  });

  it('onCloseOverlay restores preview defaults and resets data', () => {
    svc.onCloseOverlay();
    expect(xlsx.setIsPreviewing).toHaveBeenCalledWith(true);
    expect(xlsx.setIsRenderingJson).toHaveBeenCalledWith(false);
    expect(xlsx.resetAllData).toHaveBeenCalled();
  });

  it('onPreviewData toggles into rendering mode', () => {
    svc.onPreviewData();
    expect(xlsx.setIsPreviewing).toHaveBeenCalledWith(false);
    expect(xlsx.setIsRenderingJson).toHaveBeenCalledWith(true);
  });

  it('proxies count getters to xlsx process service', () => {
    expect(svc.numTotalEvents).toBe(5);
    expect(svc.numParsedEvents).toBe(3);
    expect(svc.isRenderingJson).toBe(true);
    expect(svc.isPreviewing).toBe(false);
  });

  it('postDataToWorker forwards to web-worker', () => {
    svc.postDataToWorker('a', { d: 1 }, 'n');
    expect(worker.postMessage).toHaveBeenCalledWith('message', {
      action: 'a',
      data: { d: 1 },
      name: 'n'
    });
  });

  it('withDataHandling posts non-empty data to worker', () => {
    svc.withDataHandling(of({ z: 9 }), 'extractSpecs', 'col');
    expect(worker.postMessage).toHaveBeenCalledWith('message', {
      action: 'extractSpecs',
      data: { z: 9 },
      name: 'col'
    });
  });

  it('withDataHandling opens error dialog when source errors', () => {
    svc.withDataHandling(
      throwError(() => new Error('x')),
      'a',
      'col'
    );
    expect(dialog.open).toHaveBeenCalled();
  });

  it('withWorkbookHandling resets preview flags before subscribing', () => {
    svc.withWorkbookHandling(of({ k: 1 }), 'switchSheet', 'col');
    expect(xlsx.setIsPreviewing).toHaveBeenCalledWith(true);
    expect(xlsx.setIsRenderingJson).toHaveBeenCalledWith(false);
    expect(worker.postMessage).toHaveBeenCalled();
  });

  it('switchToSelectedSheet throws when workbook is not observable', () => {
    xlsx.workbookService.workbook$.mockReturnValue({});
    expect(() => svc.switchToSelectedSheet('s')).toThrow(TypeError);
  });

  it('switchToSelectedSheet posts to worker when workbook is observable', () => {
    xlsx.workbookService.workbook$.mockReturnValue(of({ sheet: 1 }));
    svc.switchToSelectedSheet('Sheet1');
    expect(worker.postMessage).toHaveBeenCalledWith('message', {
      action: 'switchSheet',
      data: { sheet: 1 },
      name: 'Sheet1'
    });
  });

  it('onAction throws when column name is missing', () => {
    expect(() => svc.onAction('close', null)).toThrow(TypeError);
  });

  it('onAction close routes to onCloseOverlay', () => {
    svc.onAction('close', 'col');
    expect(xlsx.resetAllData).toHaveBeenCalled();
  });

  it('onAction save extracts specs then closes overlay', () => {
    svc.onAction('save', 'col');
    expect(worker.postMessage).toHaveBeenCalledWith('message', {
      action: 'extractSpecs',
      data: { x: 1 },
      name: 'col'
    });
    expect(xlsx.resetAllData).toHaveBeenCalled();
  });

  it('onAction preview previews then enters rendering mode', () => {
    svc.onAction('preview', 'col');
    expect(worker.postMessage).toHaveBeenCalledWith('message', {
      action: 'previewData',
      data: { y: 2 },
      name: 'col'
    });
    expect(xlsx.setIsRenderingJson).toHaveBeenCalledWith(true);
  });

  it('onAction unknown action is a no-op', () => {
    svc.onAction('unknown', 'col');
    expect(worker.postMessage).not.toHaveBeenCalled();
  });

  it('loadXlsxFile delegates to the process service', async () => {
    await svc.loadXlsxFile({ name: 'x.xlsx' } as never);
    expect(xlsx.loadXlsxFile).toHaveBeenCalled();
  });

  it('setters proxy through', () => {
    svc.setIsRenderingJson(true);
    svc.setIsPreviewing(true);
    svc.resetAllData();
    expect(xlsx.setIsRenderingJson).toHaveBeenCalledWith(true);
    expect(xlsx.setIsPreviewing).toHaveBeenCalledWith(true);
    expect(xlsx.resetAllData).toHaveBeenCalled();
  });
});
