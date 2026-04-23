import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { VideosService } from '../../../../shared/services/api/videos/videos.service';
import { ReportTabFacade } from './report-tab-facade.service';

describe('ReportTabFacade', () => {
  const fileReportService = {
    downloadFileReports: vi.fn()
  };
  const videosService = {
    getVideo: vi.fn()
  };
  const snackBar = {
    open: vi.fn()
  };
  let service: ReportTabFacade;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    fileReportService.downloadFileReports.mockReset();
    videosService.getVideo.mockReset();
    snackBar.open.mockReset();

    TestBed.configureTestingModule({
      providers: [
        ReportTabFacade,
        {
          provide: FileReportService,
          useValue: fileReportService
        },
        {
          provide: VideosService,
          useValue: videosService
        },
        {
          provide: MatSnackBar,
          useValue: snackBar
        }
      ]
    });

    service = TestBed.inject(ReportTabFacade);
  });

  it('copies the event name and shows a success message', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        writeText
      },
      configurable: true
    });

    service.copyEventName('purchase');
    await Promise.resolve();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('purchase');
    expect(snackBar.open).toHaveBeenCalledWith('Event name copied', undefined, {
      duration: 1500,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('returns early when there is no event name to copy', () => {
    service.copyEventName(undefined);

    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('shows an error when the clipboard api is unavailable', () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: undefined,
      configurable: true
    });

    service.copyEventName('purchase');

    expect(snackBar.open).toHaveBeenCalledWith('Unable to copy', undefined, {
      duration: 1500,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('shows an error when clipboard writes are rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: {
        writeText
      },
      configurable: true
    });

    service.copyEventName('purchase');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(snackBar.open).toHaveBeenCalledWith('Unable to copy', undefined, {
      duration: 1500,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('shows a message when spreadsheet export is unavailable for the run', () => {
    service.shareSpreadsheet('storybook-project', undefined);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Spreadsheet not available for this run',
      undefined,
      {
        duration: 1800,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  });

  it('shows an error when spreadsheet export is missing project or event context', () => {
    service.shareSpreadsheet(undefined, {
      eventId: undefined
    } as never);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Unable to download spreadsheet (missing project or event)',
      undefined,
      {
        duration: 2000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  });

  it('uses the file report service when exporting a spreadsheet without a direct url', () => {
    fileReportService.downloadFileReports.mockReturnValue(of({ ok: true }));

    service.shareSpreadsheet('storybook-project', {
      eventId: 'evt-1'
    } as never);

    expect(fileReportService.downloadFileReports).toHaveBeenCalledWith(
      'storybook-project',
      ['evt-1']
    );
    expect(snackBar.open).toHaveBeenCalledWith('Spreadsheet downloaded', undefined, {
      duration: 1400,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('downloads spreadsheets from a direct report url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['sheet']))
    });
    const createElement = vi.spyOn(document, 'createElement');
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:spreadsheet');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    createElement.mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return {
          click,
          href: '',
          download: ''
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);
    vi.stubGlobal('fetch', fetchMock);

    service.shareSpreadsheet(
      undefined,
      {
        eventId: 'evt-1',
        xlsxUrl: 'https://example.com/report.xlsx'
      } as never
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/report.xlsx', {
      credentials: 'include'
    });
    expect(click).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Spreadsheet downloaded', undefined, {
      duration: 1400,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('shows an error when a direct-url spreadsheet export fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    );

    service.shareSpreadsheet(
      undefined,
      {
        eventId: 'evt-1',
        xlsxUrl: 'https://example.com/report.xlsx'
      } as never
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(snackBar.open).toHaveBeenCalledWith(
      'Unable to download spreadsheet from URL',
      undefined,
      {
        duration: 1500,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  });

  it('downloads a recording immediately when a local blob is already available', () => {
    const createElement = vi.spyOn(document, 'createElement');
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:video');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    createElement.mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return {
          click,
          href: '',
          download: ''
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    service.exportRecording(
      'storybook-project',
      {
        eventId: 'evt-1',
        eventName: 'purchase'
      } as never,
      new Blob(['video'], { type: 'video/webm' })
    );

    expect(videosService.getVideo).not.toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Recording downloaded', undefined, {
      duration: 1400,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('shows an error when recording export is missing project or event context', () => {
    service.exportRecording(undefined, { eventId: undefined } as never, undefined);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Unable to download recording (missing project or event)',
      undefined,
      {
        duration: 1800,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  });

  it('falls back to the videos service when exporting a recording without a local blob', () => {
    const createElement = vi.spyOn(document, 'createElement');
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    videosService.getVideo.mockReturnValue(
      of({
        blob: new Blob(['video'], { type: 'video/webm' })
      })
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:video');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    createElement.mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return {
          click,
          href: '',
          download: ''
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    service.exportRecording(
      'storybook-project',
      {
        eventId: 'evt-1',
        eventName: 'purchase'
      } as never,
      undefined
    );

    expect(videosService.getVideo).toHaveBeenCalledWith(
      'storybook-project',
      'evt-1'
    );
    expect(click).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Recording downloaded', undefined, {
      duration: 1400,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('shows a no-recording message when the videos service returns an empty blob', () => {
    videosService.getVideo.mockReturnValue(
      of({
        blob: new Blob([])
      })
    );

    service.exportRecording(
      'storybook-project',
      {
        eventId: 'evt-1',
        eventName: 'purchase'
      } as never,
      undefined
    );

    expect(snackBar.open).toHaveBeenCalledWith('No recording available', undefined, {
      duration: 1500,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('shows an error when the videos service fails to export a recording', () => {
    videosService.getVideo.mockReturnValue({
      pipe: () => ({
        subscribe: ({ error }: { error: () => void }) => error()
      })
    } as never);

    service.exportRecording(
      'storybook-project',
      {
        eventId: 'evt-1',
        eventName: 'purchase'
      } as never,
      undefined
    );

    expect(snackBar.open).toHaveBeenCalledWith(
      'Unable to download recording',
      undefined,
      {
        duration: 1500,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  });

  it('shows an error when the file report service cannot download the spreadsheet', () => {
    fileReportService.downloadFileReports.mockReturnValue(of(null));

    service.shareSpreadsheet('storybook-project', {
      eventId: 'evt-1'
    } as never);

    expect(snackBar.open).toHaveBeenCalledWith(
      'Unable to download spreadsheet',
      undefined,
      {
        duration: 1800,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  });

  it('supports spreadsheet downloads via the excelUrl alias', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['sheet']))
    });
    const createElement = vi.spyOn(document, 'createElement');
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:excel-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    createElement.mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return {
          click,
          href: '',
          download: ''
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);
    vi.stubGlobal('fetch', fetchMock);

    service.shareSpreadsheet(
      undefined,
      {
        eventId: 'evt-1',
        excelUrl: 'https://example.com/report.xlsx'
      } as never
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/report.xlsx', {
      credentials: 'include'
    });
    expect(click).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Spreadsheet downloaded', undefined, {
      duration: 1400,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('supports spreadsheet downloads via the reportXlsxUrl alias', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['sheet']))
    });
    const createElement = vi.spyOn(document, 'createElement');
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:report-xlsx-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    createElement.mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return {
          click,
          href: '',
          download: ''
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    }) as typeof document.createElement);
    vi.stubGlobal('fetch', fetchMock);

    service.shareSpreadsheet(
      undefined,
      {
        eventId: 'evt-1',
        reportXlsxUrl: 'https://example.com/report.xlsx'
      } as never
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/report.xlsx', {
      credentials: 'include'
    });
    expect(click).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Spreadsheet downloaded', undefined, {
      duration: 1400,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });

  it('fans out event export to spreadsheet and recording exports', () => {
    const shareSpreadsheetSpy = vi
      .spyOn(service, 'shareSpreadsheet')
      .mockImplementation(() => undefined);
    const exportRecordingSpy = vi
      .spyOn(service, 'exportRecording')
      .mockImplementation(() => undefined);

    service.exportEvent(
      'storybook-project',
      {
        eventId: 'evt-1',
        eventName: 'purchase'
      } as never,
      new Blob(['video'], { type: 'video/webm' })
    );

    expect(shareSpreadsheetSpy).toHaveBeenCalledWith('storybook-project', {
      eventId: 'evt-1',
      eventName: 'purchase'
    });
    expect(exportRecordingSpy).toHaveBeenCalledWith(
      'storybook-project',
      {
        eventId: 'evt-1',
        eventName: 'purchase'
      },
      expect.any(Blob)
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      'Starting event export (XLSX + WEBM)',
      undefined,
      {
        duration: 1200,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  });

  it('reports recording availability based on blob size', () => {
    expect(service.getRecordingAvailable(undefined)).toBe(false);
    expect(service.getRecordingAvailable(new Blob([]))).toBe(false);
    expect(service.getRecordingAvailable(new Blob(['video']))).toBe(true);
  });
});
