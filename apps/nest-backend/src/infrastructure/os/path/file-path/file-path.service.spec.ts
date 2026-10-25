import { describe, it, expect, vi } from 'vitest';
import { FilePathService } from './file-path.service';
import { PathUtilsService } from '../path-utils/path-utils.service';
import { FolderPathService } from '../folder-path/folder-path.service';
import { ConfigsService } from '../../../../core/configs/configs.service';

describe('FilePathService', () => {
  function build() {
    const pathUtilsService = {
      buildFilePath: vi.fn(async (slug: string, sub: string, name: string) =>
        `/root/${slug}/${sub}/${name}`.replace('//', '/')
      )
    } as unknown as PathUtilsService;
    const folderPathService = {
      getReportSavingFolderPath: vi.fn(
        async (slug: string) => `/root/${slug}/inspection_results`
      ),
      getInspectionEventFolderPath: vi.fn(
        async (slug: string, eventId: string) =>
          `/root/${slug}/inspection_results/${eventId}`
      )
    } as unknown as FolderPathService;
    const configsService = {
      getRECORDING_FOLDER: () => 'chrome_recordings',
      getCONFIG_FOLDER: () => 'config',
      getSPECS: () => 'spec.json',
      getSETTINGS: () => 'settings.json',
      getMETA_DATA: () => 'project.json',
      getABSTRACT_REPORT_FILE_NAME: () => 'abstract.json'
    } as unknown as ConfigsService;
    return {
      svc: new FilePathService(
        pathUtilsService,
        folderPathService,
        configsService
      ),
      pathUtilsService,
      folderPathService
    };
  }

  it('builds the operation file path under the recording folder', async () => {
    const { svc, pathUtilsService } = build();
    const result = await svc.getOperationFilePath('p', 'evt-1');
    expect(result).toBe('/root/p/chrome_recordings/evt-1.json');
    expect(pathUtilsService.buildFilePath).toHaveBeenCalledWith(
      'p',
      'chrome_recordings',
      'evt-1.json'
    );
  });

  it('builds an inspection result file using the abstract report file name', async () => {
    const { svc } = build();
    const r = await svc.getInspectionResultFilePath('p', 'evt-1');
    expect(r.replace(/\\/g, '/')).toBe(
      '/root/p/inspection_results/evt-1/abstract.json'
    );
  });

  it('builds the recording file path for an event id', async () => {
    const { svc } = build();
    const r = await svc.getRecordingFilePath('p', 'evt-1');
    expect(r).toBe('/root/p/chrome_recordings/evt-1');
  });
});
