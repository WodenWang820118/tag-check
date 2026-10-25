import type {
  CookieData,
  EventInspectionPresetDto,
  LocalStorageData
} from '@utils';
import type { ProjectEntity } from '../../shared';
import type { InspectGtmQueryDto } from '../../shared/dto/gtm-operator';
import type { InspectSingleEventOptions } from '../event-inspection/single-event-inspection.service';

/** The project settings that decide how a test runs. */
export interface RunSettings {
  /** Accompanied mode: run through GTM Preview (Tag Assistant). */
  accompanied: boolean;
  /** Check the GA4 request as well as the dataLayer. */
  requestCheck: boolean;
  gtmPreviewUrl: string;
  websiteUrl: string;
  measurementId: string;
  username: string;
  password: string;
  /** The pre-loading values (localStorage, cookies) and browser arguments. */
  preset: EventInspectionPresetDto;
}

/** What the caller decides for one run, whatever the project says. */
export interface RunChoice {
  headless: boolean;
  /** Close a headful browser when the run ends (a headless one always closes). */
  closeBrowser: boolean;
}

/** How to run a test: through GTM Preview, or directly on the site. */
export type RunPlan =
  | {
      mode: 'accompanied';
      query: InspectGtmQueryDto;
      preset: EventInspectionPresetDto;
    }
  | { mode: 'direct'; options: InspectSingleEventOptions };

/** A preset without pre-loading values or browser arguments. */
export function emptyRunPreset(): EventInspectionPresetDto {
  return {
    application: {
      localStorage: { data: [] as LocalStorageData[] },
      cookie: { data: [] as CookieData[] }
    },
    puppeteerArgs: []
  };
}

function flag(value: boolean): string {
  return value ? 'true' : 'false';
}

/** The options of a direct run. Shared by POST /datalayer/... and the batch queue. */
export function buildDirectRunOptions(input: {
  headless: boolean;
  measurementId?: string;
  username?: string;
  password?: string;
  captureRequest: boolean;
  url: string;
  preset?: EventInspectionPresetDto;
}): InspectSingleEventOptions {
  return {
    headless: flag(input.headless),
    measurementId: input.measurementId || '',
    credentials: {
      username: input.username || '',
      password: input.password || ''
    },
    captureRequest: flag(input.captureRequest),
    url: input.url,
    eventInspectionPresetDto: input.preset ?? emptyRunPreset()
  };
}

/**
 * The query of an accompanied-mode run, as POST
 * /datalayer/gtm-operator/... receives it. The measurement ID is sent only
 * with the request check, so a run without it captures no GA4 request.
 */
export function buildAccompaniedRunQuery(input: {
  gtmUrl: string;
  headless: boolean;
  requestCheck: boolean;
  measurementId?: string;
  username?: string;
  password?: string;
  closeBrowser: boolean;
}): InspectGtmQueryDto {
  return {
    gtmUrl: input.gtmUrl,
    headless: flag(input.headless),
    measurementId: input.requestCheck ? input.measurementId || '' : '',
    username: input.username || '',
    password: input.password || '',
    captureRequest: flag(input.requestCheck),
    closeBrowser: flag(input.closeBrowser)
  };
}

/**
 * Decides how a test runs from its project's settings, as the frontend's
 * `TestRunningFacadeService.chooseAndRunTest` does for a single run: through
 * GTM Preview in accompanied mode, otherwise directly on the site, with the
 * GA4 request check when the project asks for it. The caller's choice of
 * headless replaces the project's.
 */
export function buildRunPlan(
  settings: RunSettings,
  choice: RunChoice
): RunPlan {
  if (settings.accompanied) {
    return {
      mode: 'accompanied',
      query: buildAccompaniedRunQuery({
        gtmUrl: settings.gtmPreviewUrl,
        headless: choice.headless,
        requestCheck: settings.requestCheck,
        measurementId: settings.measurementId,
        username: settings.username,
        password: settings.password,
        closeBrowser: choice.closeBrowser
      }),
      preset: settings.preset
    };
  }
  return {
    mode: 'direct',
    options: buildDirectRunOptions({
      headless: choice.headless,
      measurementId: settings.requestCheck ? settings.measurementId : '',
      username: settings.username,
      password: settings.password,
      captureRequest: settings.requestCheck,
      url: settings.websiteUrl,
      preset: settings.preset
    })
  };
}

/**
 * Reads the run settings of a project loaded with its application, browser
 * and authentication settings. Missing settings read as off or empty.
 */
export function toRunSettings(project: ProjectEntity): RunSettings {
  const application = project.applicationSettings;
  const gtm = application?.gtm;
  return {
    accompanied: gtm?.isAccompanyMode === true,
    requestCheck: gtm?.isRequestCheck === true,
    gtmPreviewUrl: gtm?.gtmPreviewModeUrl ?? '',
    websiteUrl: application?.websiteUrl ?? '',
    measurementId: project.measurementId ?? '',
    username: project.authenticationSettings?.username ?? '',
    password: project.authenticationSettings?.password ?? '',
    preset: {
      application: {
        localStorage: { data: [...(application?.localStorage?.data ?? [])] },
        cookie: { data: [...(application?.cookie?.data ?? [])] }
      },
      puppeteerArgs: [...(project.browserSettings?.browser ?? [])]
    }
  };
}
