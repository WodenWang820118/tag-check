import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigsService } from './configs.service';

describe('ConfigsService', () => {
  let svc: ConfigsService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    svc = new ConfigsService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('exposes static config getters', () => {
    expect(svc.getUSER_AGENT()).toContain('Mozilla');
    expect(svc.getRECORDING_FOLDER()).toBe('chrome_recordings');
    expect(svc.getRESULT_FOLDER()).toBe('inspection_results');
    expect(svc.getCONFIG_FOLDER()).toBe('config');
    expect(svc.getCONFIG_ROOT_PATH()).toBe('rootProjectPath');
    expect(svc.getCONFIG_CURRENT_PROJECT_PATH()).toBe('currentProjectPath');
    expect(svc.getABSTRACT_REPORT_FILE_NAME()).toBe('abstract.json');
    expect(svc.getSPECS()).toBe('spec.json');
    expect(svc.getSETTINGS()).toBe('settings.json');
    expect(svc.getMETA_DATA()).toBe('project.json');
    expect(svc.getDEFAULT_PROJECT_PATH()).toBe('tag_check_projects');
    expect(svc.getDEFAULT_DATABASE_PATH()).toBe('data.sqlite3');
    expect(svc.getBROWSER_ARGS()).toEqual(
      expect.arrayContaining(['--no-sandbox', '--disable-gpu'])
    );
  });

  describe('getDatabasePath', () => {
    it('returns DATABASE_PATH env var when NODE_ENV=prod', () => {
      process.env.NODE_ENV = 'prod';
      process.env.DATABASE_PATH = '/custom/db.sqlite';
      expect(svc.getDatabasePath()).toBe('/custom/db.sqlite');
    });

    it('returns the default path under cwd when NODE_ENV=dev', () => {
      process.env.NODE_ENV = 'dev';
      const result = svc.getDatabasePath();
      expect(result).toContain('.db');
      expect(result).toContain('data.sqlite3');
    });

    it('falls back to default path when NODE_ENV is unset', () => {
      delete process.env.NODE_ENV;
      const result = svc.getDatabasePath();
      expect(result).toContain('data.sqlite3');
    });
  });

  describe('getRootProjectPath', () => {
    it('returns ROOT_PROJECT_PATH env var when NODE_ENV=prod', () => {
      process.env.NODE_ENV = 'prod';
      process.env.ROOT_PROJECT_PATH = '/custom/projects';
      expect(svc.getRootProjectPath()).toBe('/custom/projects');
    });

    it('returns the default project path when NODE_ENV=dev', () => {
      process.env.NODE_ENV = 'dev';
      const result = svc.getRootProjectPath();
      expect(result).toContain('tag_check_projects');
    });
  });

  it('exposes uppercase aliases that delegate to the path getters', () => {
    process.env.NODE_ENV = 'dev';
    expect(svc.getDATABASE_PATH()).toBe(svc.getDatabasePath());
    expect(svc.getROOT_PROJECT_PATH()).toBe(svc.getRootProjectPath());
  });
});
