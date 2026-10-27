import { describe, expect, it, vi } from 'vitest';
import type { ProjectEntity } from '../../shared';
import type { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';
import type { GtmOperatorService } from '../gtm-operator/gtm-operator.service';
import type { SingleEventInspectionService } from '../event-inspection/single-event-inspection.service';
import { TestRunService } from './test-run.service';

function project(gtm: { isAccompanyMode: boolean; isRequestCheck: boolean }) {
  return {
    projectSlug: 'shop',
    measurementId: 'G-1',
    applicationSettings: {
      websiteUrl: 'https://shop.example/',
      localStorage: { data: [] },
      cookie: { data: [] },
      gtm: { ...gtm, tagManagerUrl: '', gtmPreviewModeUrl: 'https://gtm' }
    },
    browserSettings: { browser: [], headless: false },
    authenticationSettings: { username: '', password: '' }
  } as unknown as ProjectEntity;
}

function setUp(entity: ProjectEntity) {
  const projects = {
    getRunSettingsEntityBySlug: vi.fn().mockResolvedValue(entity)
  };
  const gtm = { inspectSingleEventViaGtm: vi.fn().mockResolvedValue([]) };
  const direct = {
    inspectSingleEvent: vi.fn().mockResolvedValue([]),
    abort: vi.fn()
  };
  const service = new TestRunService(
    projects as unknown as ProjectRepositoryService,
    gtm as unknown as GtmOperatorService,
    direct as unknown as SingleEventInspectionService
  );
  return { service, gtm, direct };
}

describe('TestRunService', () => {
  it('runs an accompanied project through GTM Preview, closing the browser', async () => {
    const { service, gtm, direct } = setUp(
      project({ isAccompanyMode: true, isRequestCheck: true })
    );

    await service.run('shop', 'evt', { headless: true });

    expect(direct.inspectSingleEvent).not.toHaveBeenCalled();
    expect(gtm.inspectSingleEventViaGtm).toHaveBeenCalledWith(
      'shop',
      'evt',
      expect.objectContaining({
        gtmUrl: 'https://gtm',
        headless: 'true',
        measurementId: 'G-1',
        captureRequest: 'true',
        closeBrowser: 'true'
      }),
      expect.objectContaining({ puppeteerArgs: [] }),
      undefined,
      undefined
    );
  });

  it('runs a direct project on the site with the chosen headless value', async () => {
    const { service, gtm, direct } = setUp(
      project({ isAccompanyMode: false, isRequestCheck: false })
    );

    await service.run('shop', 'evt', { headless: false });

    expect(gtm.inspectSingleEventViaGtm).not.toHaveBeenCalled();
    expect(direct.inspectSingleEvent).toHaveBeenCalledWith(
      'shop',
      'evt',
      expect.objectContaining({
        headless: 'false',
        captureRequest: 'false',
        url: 'https://shop.example/'
      }),
      undefined,
      undefined
    );
  });

  it("passes a batch run's place in its batch to the run", async () => {
    const { service, gtm, direct } = setUp(
      project({ isAccompanyMode: true, isRequestCheck: false })
    );
    const batch = {
      batchId: 3,
      position: 2,
      total: 4,
      source: 'schedule' as const
    };

    await service.run('shop', 'evt', { headless: true, batch });

    expect(direct.inspectSingleEvent).not.toHaveBeenCalled();
    expect(gtm.inspectSingleEventViaGtm).toHaveBeenCalledWith(
      'shop',
      'evt',
      expect.anything(),
      expect.anything(),
      batch,
      undefined
    );
  });

  it('passes a trial run its step override', async () => {
    const { service, direct } = setUp(
      project({ isAccompanyMode: false, isRequestCheck: true })
    );
    const stepOverride = { stepIndex: 4, selectors: ['#new'] };

    await service.run('shop', 'evt', { headless: true, stepOverride });

    expect(direct.inspectSingleEvent).toHaveBeenCalledWith(
      'shop',
      'evt',
      expect.anything(),
      undefined,
      stepOverride
    );
  });

  it('rejects as the run does', async () => {
    const { service, direct } = setUp(
      project({ isAccompanyMode: false, isRequestCheck: true })
    );
    direct.inspectSingleEvent.mockRejectedValue(new Error('boom'));

    await expect(
      service.run('shop', 'evt', { headless: true })
    ).rejects.toThrow('boom');
  });

  it('stops every queued run', () => {
    const { service, direct } = setUp(
      project({ isAccompanyMode: false, isRequestCheck: true })
    );

    service.stopAll();

    expect(direct.abort).toHaveBeenCalledOnce();
  });
});
