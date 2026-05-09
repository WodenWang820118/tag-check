import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { ImageService } from '../../../shared/services/api/image/image.service';
import { ReportService } from '../../../shared/services/api/report/report.service';
import { VideosService } from '../../../shared/services/api/videos/videos.service';
import {
  imageResolver,
  projectReportResolver,
  reportDetailResolver,
  videoResolver
} from './report.resolver';

describe('project report.resolver', () => {
  const reportService = {
    getReportDetails: vi.fn(),
    getProjectReports: vi.fn()
  };
  const imageService = { getImage: vi.fn() };
  const videoService = { getVideo: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    reportService.getReportDetails = vi.fn();
    reportService.getProjectReports = vi.fn();
    imageService.getImage = vi.fn();
    videoService.getVideo = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: ReportService, useValue: reportService },
        { provide: ImageService, useValue: imageService },
        { provide: VideosService, useValue: videoService }
      ]
    });
  });

  function run<T>(fn: () => T) {
    return TestBed.runInInjectionContext(fn);
  }

  it('reportDetailResolver fetches details using parent slug + event id', () => {
    const obs = of({} as any);
    reportService.getReportDetails.mockReturnValue(obs);
    const route = {
      parent: { params: { projectSlug: 'p' } } as any,
      params: { eventId: 'e' }
    } as unknown as ActivatedRouteSnapshot;
    expect(
      run(() => reportDetailResolver(route, {} as RouterStateSnapshot))
    ).toBe(obs);
    expect(reportService.getReportDetails).toHaveBeenCalledWith('p', 'e');
  });

  it('videoResolver delegates to VideosService', () => {
    const obs = of({ blob: new Blob() });
    videoService.getVideo.mockReturnValue(obs);
    const route = {
      parent: { params: { projectSlug: 'p' } } as any,
      params: { eventId: 'e' }
    } as unknown as ActivatedRouteSnapshot;
    expect(run(() => videoResolver(route, {} as RouterStateSnapshot))).toBe(
      obs
    );
    expect(videoService.getVideo).toHaveBeenCalledWith('p', 'e');
  });

  it('imageResolver delegates to ImageService', () => {
    const obs = of({ blob: new Blob() });
    imageService.getImage.mockReturnValue(obs);
    const route = {
      parent: { params: { projectSlug: 'p' } } as any,
      params: { eventId: 'e' }
    } as unknown as ActivatedRouteSnapshot;
    expect(run(() => imageResolver(route, {} as RouterStateSnapshot))).toBe(
      obs
    );
    expect(imageService.getImage).toHaveBeenCalledWith('p', 'e');
  });

  it('projectReportResolver lists reports for the route slug', () => {
    const obs = of([] as any);
    reportService.getProjectReports.mockReturnValue(obs);
    const route = { params: { projectSlug: 'p' } } as any;
    expect(
      run(() => projectReportResolver(route, {} as RouterStateSnapshot))
    ).toBe(obs);
    expect(reportService.getProjectReports).toHaveBeenCalledWith('p');
  });
});
