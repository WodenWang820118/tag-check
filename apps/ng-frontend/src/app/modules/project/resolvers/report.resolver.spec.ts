import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import {
  DataLayerSpec,
  Recording,
  REPORT_DETAIL_SAMPLE,
  ReportDetailResponse
} from '@utils';
import { ImageService } from '../../../shared/services/api/image/image.service';
import { RecordingService } from '../../../shared/services/api/recording/recording.service';
import { ReportService } from '../../../shared/services/api/report/report.service';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import { VideosService } from '../../../shared/services/api/videos/videos.service';
import { ReportDetailRouteContext } from '../components/report-detail.contracts';
import {
  projectReportResolver,
  readRunId,
  reportPageResolver
} from './report.resolver';

describe('project report.resolver', () => {
  const detail = JSON.parse(
    JSON.stringify(REPORT_DETAIL_SAMPLE)
  ) as ReportDetailResponse;
  const spec = { event: 'add_to_cart' } as unknown as DataLayerSpec;
  const recording = { title: 'add_to_cart', steps: [] } as Recording;
  const video = { blob: new Blob(['webm']) };
  const image = { blob: new Blob(['png']) };

  const reportService = {
    getReportDetails: vi.fn(() => of(detail)),
    getProjectReports: vi.fn()
  };
  const specService = { getEventSpec: vi.fn(() => of(spec)) };
  const recordingService = { getRecordingDetails: vi.fn(() => of(recording)) };
  const videoService = { getVideo: vi.fn(() => of(video)) };
  const imageService = { getImage: vi.fn(() => of(image)) };

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: SpecService, useValue: specService },
        { provide: RecordingService, useValue: recordingService },
        { provide: VideosService, useValue: videoService },
        { provide: ImageService, useValue: imageService }
      ]
    });
  });

  function resolvePage(queryParams: Record<string, string> = {}) {
    const route = {
      parent: { params: { projectSlug: 'demo' } },
      params: { eventId: 'evt-1' },
      queryParams
    } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(
      () =>
        reportPageResolver(
          route,
          {} as RouterStateSnapshot
        ) as Observable<ReportDetailRouteContext>
    );
  }

  it('loads the report, spec, recording and media for the route', async () => {
    await firstValueFrom(resolvePage());

    expect(reportService.getReportDetails).toHaveBeenCalledWith(
      'demo',
      'evt-1',
      undefined
    );
    expect(specService.getEventSpec).toHaveBeenCalledWith('demo', 'evt-1');
    expect(recordingService.getRecordingDetails).toHaveBeenCalledWith(
      'demo',
      'evt-1'
    );
    expect(videoService.getVideo).toHaveBeenCalledWith(
      'demo',
      'evt-1',
      undefined,
      undefined
    );
    expect(imageService.getImage).toHaveBeenCalledWith(
      'demo',
      'evt-1',
      undefined
    );
  });

  it('loads the run ?run= picks, with its recordings and screenshot', async () => {
    await firstValueFrom(resolvePage({ run: '5' }));

    expect(reportService.getReportDetails).toHaveBeenCalledWith(
      'demo',
      'evt-1',
      5
    );
    expect(videoService.getVideo).toHaveBeenCalledWith(
      'demo',
      'evt-1',
      undefined,
      5
    );
    expect(videoService.getVideo).toHaveBeenCalledWith(
      'demo',
      'evt-1',
      'tag-assistant',
      5
    );
    expect(imageService.getImage).toHaveBeenCalledWith('demo', 'evt-1', 5);
  });

  it('reads only a positive whole run id', () => {
    expect(readRunId('7')).toBe(7);
    for (const value of [undefined, '', 'abc', '0', '-2', '1.5']) {
      expect(readRunId(value)).toBeUndefined();
    }
  });

  it('builds the report page from what it loaded', async () => {
    const page = await firstValueFrom(resolvePage());

    expect(page).toMatchObject({
      projectSlug: 'demo',
      eventId: 'evt-1',
      spec,
      recording,
      videoBlob: video.blob,
      imageBlob: image.blob,
      historyLinkCommands: ['..', 'buckets']
    });
    expect(page.reportDetails?.eventName).toBe('add_to_cart');
    expect(page.run?.id).toBe(detail.testEventDetails?.id);
    expect(page.runs).toBe(detail.runs);
    expect(page.isLatestRun).toBe(true);
  });

  it('projectReportResolver delegates to getProjectReports with the slug', () => {
    const reports = of([]);
    reportService.getProjectReports.mockReturnValue(reports);

    const result = TestBed.runInInjectionContext(() =>
      projectReportResolver(
        {
          params: { projectSlug: 'demo' }
        } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    expect(result).toBe(reports);
    expect(reportService.getProjectReports).toHaveBeenCalledWith('demo');
  });
});
