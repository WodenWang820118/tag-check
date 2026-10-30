import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectSetting, ReportDetailResponse } from '@utils';
import { DataLayerService } from '../api/datalayer/datalayer.service';
import { GtmOperatorService } from '../api/gtm-operator/gtm-operator.service';
import { QaRequestService } from '../api/qa-request/qa-request.service';
import { SettingsService } from '../api/settings/settings.service';
import { ProjectDataSourceService } from '../data-source/project-data-source.service';
import { TestRunningFacadeService } from './test-running-facade.service';
import { RunHeadlessService } from '../../../modules/project/services/run-headless/run-headless.service';

/** Project settings as GET /settings/:projectSlug returns them. */
function settingsJson(isAccompanyMode: boolean): ProjectSetting {
  return JSON.parse(
    JSON.stringify({
      projectSlug: 'demo',
      measurementId: 'G-8HKQR5ZBSK',
      browserSettings: { headless: false, browser: [] },
      authenticationSettings: { username: '', password: '' },
      applicationSettings: {
        websiteUrl: 'https://ng-gtm-sample.vercel.app/home',
        localStorage: { data: [] },
        cookie: { data: [] },
        gtm: {
          isAccompanyMode,
          isRequestCheck: true,
          gtmPreviewModeUrl:
            'https://tagassistant.google.com/#/?id=GTM-NBMX2DWS'
        }
      }
    })
  ) as ProjectSetting;
}

describe('TestRunningFacadeService.runTestForReport', () => {
  let runInspectionViaGtm: ReturnType<typeof vi.fn>;
  let runDataLayerWithRequestCheck: ReturnType<typeof vi.fn>;

  function create(isAccompanyMode: boolean) {
    runInspectionViaGtm = vi.fn(() => of([] as ReportDetailResponse[]));
    runDataLayerWithRequestCheck = vi.fn(() =>
      of([] as ReportDetailResponse[])
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: DataLayerService, useValue: {} },
        { provide: GtmOperatorService, useValue: { runInspectionViaGtm } },
        {
          provide: QaRequestService,
          useValue: { runDataLayerWithRequestCheck }
        },
        { provide: ProjectDataSourceService, useValue: {} },
        {
          provide: SettingsService,
          useValue: {
            getProjectSettings: () => of(settingsJson(isAccompanyMode))
          }
        }
      ]
    });
    return TestBed.inject(TestRunningFacadeService);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('runs through GTM Preview headless when the run asks for it', async () => {
    const service = create(true);

    await firstValueFrom(
      service.runTestForReport('evt', 'demo', { headless: true })
    );

    expect(runInspectionViaGtm).toHaveBeenCalledWith(
      'demo',
      'evt',
      expect.objectContaining({
        headless: true,
        measurementId: 'G-8HKQR5ZBSK'
      })
    );
    expect(service.isRunningTest$()).toBe(false);
  });

  it("uses the freshly loaded project's browser setting when the run does not choose", async () => {
    const service = create(true);

    await firstValueFrom(service.runTestForReport('evt', 'demo'));

    expect(runInspectionViaGtm).toHaveBeenCalledWith(
      'demo',
      'evt',
      expect.objectContaining({ headless: false })
    );
  });

  it.each([true, false])(
    'uses the Tests page choice for Run again without options (accompanied: %s)',
    async (isAccompanyMode) => {
      const service = create(isAccompanyMode);
      const choice = TestBed.inject(RunHeadlessService);
      choice.load('demo');
      choice.set(true);
      await firstValueFrom(service.runTestForReport('evt', 'demo'));
      const run = isAccompanyMode
        ? runInspectionViaGtm
        : runDataLayerWithRequestCheck;
      expect(run).toHaveBeenCalledWith(
        'demo',
        'evt',
        expect.objectContaining({ headless: true })
      );
      localStorage.clear();
    }
  );

  it('opens the site directly when the project does not use accompanied mode', async () => {
    const service = create(false);

    await expect(
      firstValueFrom(
        service.runTestForReport('evt', 'demo', { headless: true })
      )
    ).resolves.toBeUndefined();

    expect(runInspectionViaGtm).not.toHaveBeenCalled();
    expect(runDataLayerWithRequestCheck).toHaveBeenCalledWith(
      'demo',
      'evt',
      expect.objectContaining({
        measurementId: 'G-8HKQR5ZBSK',
        headless: true
      })
    );
  });
});
