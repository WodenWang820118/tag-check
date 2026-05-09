import { describe, expect, it, vi } from 'vitest';
import { join } from 'path';
import { PathUtilsService } from './path-utils.service';

describe('PathUtilsService', () => {
  function build(rootPath = '/data/projects') {
    const config = {
      getRootProjectPath: vi.fn().mockResolvedValue(rootPath)
    } as never;
    return new PathUtilsService(config);
  }

  it('buildFilePath joins root + project + folder + file', async () => {
    const service = build('/data/projects');
    const result = await service.buildFilePath('demo', 'reports', 'a.json');
    expect(result).toBe(join('/data/projects', 'demo', 'reports', 'a.json'));
  });

  it('buildFilePath tolerates an empty file name', async () => {
    const service = build('/data/projects');
    const result = await service.buildFilePath('demo', 'reports', '');
    expect(result).toBe(join('/data/projects', 'demo', 'reports'));
  });

  it('buildFolderPath joins root + slug + folder', async () => {
    const service = build('/data/projects');
    const result = await service.buildFolderPath('demo', 'images');
    expect(result).toBe(join('/data/projects', 'demo', 'images'));
  });
});
