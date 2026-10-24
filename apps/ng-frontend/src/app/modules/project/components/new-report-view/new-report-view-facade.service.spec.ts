import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, of, throwError, toArray } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { LoggerService } from '../../../../shared/services/logger/logger.service';
import { NewReportViewFacadeService } from './new-report-view-facade.service';

/** An editor as the facade reads it: `state.doc.toString()`. */
const editor = (text: string) => () => ({
  state: { doc: { toString: () => text } }
});

describe('NewReportViewFacadeService.onFileSelected', () => {
  it('shows the uploaded recording in the recording editor', async () => {
    const setContent = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { error: vi.fn(), info: vi.fn() } },
        { provide: ReportService, useValue: {} },
        { provide: EditorService, useValue: { setContent } },
        { provide: Location, useValue: {} },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: RecordingService, useValue: {} },
        { provide: ProjectDataSourceService, useValue: {} },
        { provide: UploadSpecService, useValue: {} }
      ]
    });
    const service = TestBed.inject(NewReportViewFacadeService);
    // A Chrome Recorder export.
    const recording = JSON.stringify({
      title: 'add_to_cart',
      steps: [{ type: 'navigate', url: 'https://ng-gtm-sample.vercel.app/' }]
    });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File([recording], 'add_to_cart.json')]
    });
    input.addEventListener('change', (event) => service.onFileSelected(event));

    input.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(setContent).toHaveBeenCalled());

    expect(setContent).toHaveBeenCalledWith('recordingJson', recording);
  });
});

describe('NewReportViewFacadeService.uploadReport', () => {
  let addReport: ReturnType<typeof vi.fn>;
  let setData: ReturnType<typeof vi.fn>;

  function create(spec: string, recording: string) {
    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: { error: vi.fn() } },
        { provide: ReportService, useValue: { addReport } },
        {
          provide: EditorService,
          useValue: {
            editor$: {
              specJsonEditor: editor(spec),
              recordingJsonEditor: editor(recording)
            }
          }
        },
        { provide: Location, useValue: {} },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: RecordingService, useValue: {} },
        {
          provide: ProjectDataSourceService,
          useValue: { connect: () => of([]), setData }
        },
        { provide: UploadSpecService, useValue: { completeUpload: vi.fn() } }
      ]
    });
    const service = TestBed.inject(NewReportViewFacadeService);
    const showErrorDialog = vi
      .spyOn(service, 'showErrorDialog')
      .mockResolvedValue(undefined);
    return { service, showErrorDialog };
  }

  beforeEach(() => {
    addReport = vi.fn(() => of({}));
    setData = vi.fn();
  });

  it('asks for a spec when the spec editor is empty', async () => {
    const { service, showErrorDialog } = create('', '');

    await expect(
      firstValueFrom(service.uploadReport('demo').pipe(toArray()))
    ).resolves.toEqual([]);
    expect(showErrorDialog).toHaveBeenCalledWith(
      'Spec content is required and cannot be empty.'
    );
  });

  it('reports a spec that is not valid JSON instead of throwing', async () => {
    const { service, showErrorDialog } = create('{ event: ', '');

    await expect(
      firstValueFrom(service.uploadReport('demo').pipe(toArray()))
    ).resolves.toEqual([]);
    expect(showErrorDialog).toHaveBeenCalledWith('Spec must be valid JSON.');
    expect(addReport).not.toHaveBeenCalled();
  });

  it('reports a recording that is not valid JSON', async () => {
    const { service, showErrorDialog } = create(
      '{"event":"add_to_cart"}',
      '{ steps: '
    );

    await firstValueFrom(service.uploadReport('demo').pipe(toArray()));
    expect(showErrorDialog).toHaveBeenCalledWith(
      'Recording must be valid JSON.'
    );
  });

  it('adds the test with the parsed spec and recording', async () => {
    const { service, showErrorDialog } = create(
      '{"event":"add_to_cart","ecommerce":{"currency":"USD"}}',
      '{"title":"add_to_cart","steps":[]}'
    );

    await firstValueFrom(service.uploadReport('demo'));

    expect(addReport).toHaveBeenCalledWith(
      'demo',
      expect.any(String),
      expect.objectContaining({
        testName: 'add_to_cart',
        eventName: 'add_to_cart'
      }),
      { title: 'add_to_cart', steps: [] },
      { event: 'add_to_cart', ecommerce: { currency: 'USD' } }
    );
    expect(setData).toHaveBeenCalledOnce();
    expect(showErrorDialog).not.toHaveBeenCalled();
  });

  it('reports a failed save and passes the error on', async () => {
    addReport = vi.fn(() => throwError(() => new Error('500')));
    const { service, showErrorDialog } = create('{"event":"add_to_cart"}', '');

    await expect(firstValueFrom(service.uploadReport('demo'))).rejects.toThrow(
      '500'
    );
    expect(showErrorDialog).toHaveBeenCalledWith(
      'Failed to add report. Please try again.'
    );
  });
});
