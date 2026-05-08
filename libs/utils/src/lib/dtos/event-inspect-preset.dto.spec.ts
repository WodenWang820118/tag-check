import { describe, expect, it } from 'vitest';
import {
  ApplicationDto,
  CookieDto,
  EventInspectionPresetDto,
  LocalStorageDto
} from './event-inspect-preset.dto';

const ls = [{ key: 'k1', value: 'v1' }];
const ck = [{ name: 'c1', value: 'v1', domain: 'd' }];

describe('LocalStorageDto', () => {
  it('clones the input array (immutable copy)', () => {
    const dto = new LocalStorageDto(ls as never);
    expect(dto.data).toEqual(ls);
    expect(dto.data).not.toBe(ls);
  });
});

describe('CookieDto', () => {
  it('clones the input cookie array', () => {
    const dto = new CookieDto(ck as never);
    expect(dto.data).toEqual(ck);
    expect(dto.data).not.toBe(ck);
  });
});

describe('ApplicationDto', () => {
  it('copies localStorage and cookie data into nested DTOs', () => {
    const app = { localStorage: { data: ls }, cookie: { data: ck } };
    const dto = new ApplicationDto(app as never);
    expect(dto.localStorage.data).toEqual(ls);
    expect(dto.localStorage.data).not.toBe(ls);
    expect(dto.cookie.data).toEqual(ck);
    expect(dto.cookie.data).not.toBe(ck);
  });
});

describe('EventInspectionPresetDto', () => {
  it('builds application and puppeteerArgs from a ProjectSetting', () => {
    const project = {
      applicationSettings: {
        localStorage: { data: ls },
        cookie: { data: ck }
      },
      browserSettings: { browser: ['--no-sandbox', '--disable-gpu'] }
    };
    const dto = new EventInspectionPresetDto(project as never);
    expect(dto.application.localStorage.data).toEqual(ls);
    expect(dto.application.cookie.data).toEqual(ck);
    expect(dto.puppeteerArgs).toEqual(['--no-sandbox', '--disable-gpu']);
    expect(dto.puppeteerArgs).not.toBe(project.browserSettings.browser);
  });
});
