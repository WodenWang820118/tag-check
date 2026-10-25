import { describe, expect, it } from 'vitest';
import type { ProjectEntity } from '../../shared';
import {
  buildAccompaniedRunQuery,
  buildDirectRunOptions,
  buildRunPlan,
  emptyRunPreset,
  RunSettings,
  toRunSettings
} from './run-options';

const GTM_URL =
  'https://tagassistant.google.com/#/?id=GTM-ABC&url=https%3A%2F%2Fshop.example%2F';

function settings(overrides: Partial<RunSettings> = {}): RunSettings {
  return {
    accompanied: false,
    requestCheck: false,
    gtmPreviewUrl: GTM_URL,
    websiteUrl: 'https://shop.example/',
    measurementId: 'G-123',
    username: 'qa',
    password: 'secret',
    preset: {
      application: {
        localStorage: { data: [{ key: 'consent', value: 'yes' }] },
        cookie: { data: [] }
      },
      puppeteerArgs: ['--lang=en']
    },
    ...overrides
  };
}

describe('buildRunPlan', () => {
  it('runs an accompanied project through GTM Preview with the request check', () => {
    const plan = buildRunPlan(
      settings({ accompanied: true, requestCheck: true }),
      { headless: true, closeBrowser: true }
    );

    expect(plan).toEqual({
      mode: 'accompanied',
      query: {
        gtmUrl: GTM_URL,
        headless: 'true',
        measurementId: 'G-123',
        username: 'qa',
        password: 'secret',
        captureRequest: 'true',
        closeBrowser: 'true'
      },
      preset: settings().preset
    });
  });

  it('sends no measurement ID in accompanied mode without the request check', () => {
    const plan = buildRunPlan(settings({ accompanied: true }), {
      headless: false,
      closeBrowser: false
    });

    expect(plan.mode).toBe('accompanied');
    expect(plan.mode === 'accompanied' && plan.query).toMatchObject({
      headless: 'false',
      measurementId: '',
      captureRequest: 'false',
      closeBrowser: 'false'
    });
  });

  it('runs a direct project on the site with the request check', () => {
    const plan = buildRunPlan(settings({ requestCheck: true }), {
      headless: true,
      closeBrowser: true
    });

    expect(plan).toEqual({
      mode: 'direct',
      options: {
        headless: 'true',
        measurementId: 'G-123',
        credentials: { username: 'qa', password: 'secret' },
        captureRequest: 'true',
        url: 'https://shop.example/',
        eventInspectionPresetDto: settings().preset
      }
    });
  });

  it('runs a direct project without the request check and its measurement ID', () => {
    const plan = buildRunPlan(settings(), {
      headless: false,
      closeBrowser: true
    });

    expect(plan.mode === 'direct' && plan.options).toMatchObject({
      headless: 'false',
      measurementId: '',
      captureRequest: 'false',
      url: 'https://shop.example/'
    });
  });
});

describe('buildDirectRunOptions', () => {
  it('fills the missing values the way POST /datalayer did', () => {
    expect(
      buildDirectRunOptions({
        headless: false,
        captureRequest: false,
        url: 'https://shop.example/'
      })
    ).toEqual({
      headless: 'false',
      measurementId: '',
      credentials: { username: '', password: '' },
      captureRequest: 'false',
      url: 'https://shop.example/',
      eventInspectionPresetDto: emptyRunPreset()
    });
  });
});

describe('buildAccompaniedRunQuery', () => {
  it('ignores the measurement ID without the request check', () => {
    expect(
      buildAccompaniedRunQuery({
        gtmUrl: GTM_URL,
        headless: true,
        requestCheck: false,
        measurementId: 'G-123',
        closeBrowser: true
      })
    ).toMatchObject({ measurementId: '', captureRequest: 'false' });
  });
});

describe('toRunSettings', () => {
  it('reads a project with its settings', () => {
    const project = {
      measurementId: 'G-9',
      applicationSettings: {
        websiteUrl: 'https://shop.example/',
        localStorage: { data: [{ key: 'k', value: 'v' }] },
        cookie: { data: [{ key: 'c', value: '1' }] },
        gtm: {
          isAccompanyMode: true,
          isRequestCheck: true,
          tagManagerUrl: '',
          gtmPreviewModeUrl: GTM_URL
        }
      },
      browserSettings: { browser: ['--lang=en'], headless: false },
      authenticationSettings: { username: 'qa', password: 'pw' }
    } as unknown as ProjectEntity;

    expect(toRunSettings(project)).toEqual({
      accompanied: true,
      requestCheck: true,
      gtmPreviewUrl: GTM_URL,
      websiteUrl: 'https://shop.example/',
      measurementId: 'G-9',
      username: 'qa',
      password: 'pw',
      preset: {
        application: {
          localStorage: { data: [{ key: 'k', value: 'v' }] },
          cookie: { data: [{ key: 'c', value: '1' }] }
        },
        puppeteerArgs: ['--lang=en']
      }
    });
  });

  it('reads missing settings as off or empty', () => {
    const project = { projectSlug: 'bare' } as unknown as ProjectEntity;

    expect(toRunSettings(project)).toEqual({
      accompanied: false,
      requestCheck: false,
      gtmPreviewUrl: '',
      websiteUrl: '',
      measurementId: '',
      username: '',
      password: '',
      preset: emptyRunPreset()
    });
  });
});
