import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { ProjectSpecService } from './project-spec.service';
import { FileService } from '../../os/file/file.service';
import { FilePathService } from '../../os/path/file-path/file-path.service';
import { Spec } from '@utils';
import { describe, beforeEach, it, expect, vi } from 'vitest';

const moduleMocker = new ModuleMocker(global);

describe('ProjectSpecService', () => {
  let service: ProjectSpecService;
  let fileService: FileService;
  let filePathService: FilePathService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectSpecService],
    })
      .useMocker((token) => {
        if (token === FileService) {
          return {
            readJsonFile: vi.fn(),
            writeJsonFile: vi.fn(),
          };
        }

        if (token === FilePathService) {
          return {
            getProjectConfigFilePath: vi.fn(() => 'filePath'),
          };
        }

        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = moduleRef.get<ProjectSpecService>(ProjectSpecService);
    fileService = moduleRef.get<FileService>(FileService);
    filePathService = moduleRef.get<FilePathService>(FilePathService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get project specs', async () => {
    const projectSlug = 'projectSlug';
    const content = [{ event: 'eventName' }];
    const readFileSpy = vi
      .spyOn(fileService, 'readJsonFile')
      .mockReturnValue(content);
    const result = await service.getProjectSpecs(projectSlug);

    expect(result).toEqual({
      projectSlug,
      specs: content,
    });
    expect(fileService.readJsonFile).toHaveBeenCalledWith('filePath');
    expect(filePathService.getProjectConfigFilePath).toHaveBeenCalledWith(
      projectSlug
    );
    readFileSpy.mockRestore();
  });

  it('should get spec', async () => {
    const projectSlug = 'projectSlug';
    const eventName = 'eventName';
    const content = [{ event: 'eventName' }];
    const spy = vi.spyOn(fileService, 'readJsonFile').mockReturnValue(content);
    const result = await service.getSpec(projectSlug, eventName);

    expect(result).toEqual(content[0]);
    expect(filePathService.getProjectConfigFilePath).toHaveBeenCalledWith(
      projectSlug
    );
    spy.mockRestore();
  });

  it('should add spec', async () => {
    const projectSlug = 'projectSlug';
    const spec = { event: 'eventName' };
    const content: Spec[] = [{ event: 'existingEvent' }];
    const readSpy = vi
      .spyOn(fileService, 'readJsonFile')
      .mockReturnValue(content);
    const writeSpy = vi.spyOn(fileService, 'writeJsonFile');
    const result = await service.addSpec(projectSlug, spec);
    const expectedSpec = [...content, spec];

    expect(result.projectSlug).toBe(projectSlug);
    expect(result.specs).toContainEqual(expectedSpec[0]);
    expect(result.specs).toContainEqual(expectedSpec[1]);
    expect(result.specs).toHaveLength(2);
    expect(filePathService.getProjectConfigFilePath).toHaveBeenCalledWith(
      projectSlug
    );
    expect(writeSpy).toHaveBeenCalledWith(
      'filePath',
      expect.arrayContaining(expectedSpec)
    );
    readSpy.mockRestore();
    writeSpy.mockRestore();
  });

  it('should update spec', async () => {
    const projectSlug = 'projectSlug';
    const eventName = 'existingEvent';
    const spec = { event: 'eventName' };
    const content: Spec[] = [{ event: 'existingEvent' }];
    const readSpy = vi
      .spyOn(fileService, 'readJsonFile')
      .mockReturnValue(content);
    const writeSpy = vi.spyOn(fileService, 'writeJsonFile');
    const result = await service.updateSpec(projectSlug, eventName, spec);
    const expectedSpec = [{ event: 'eventName' }];

    expect(result.projectSlug).toBe(projectSlug);
    expect(result.specs).toContainEqual(expectedSpec[0]);
    expect(result.specs).toHaveLength(1);
    expect(filePathService.getProjectConfigFilePath).toHaveBeenCalledWith(
      projectSlug
    );
    expect(writeSpy).toHaveBeenCalledWith('filePath', expectedSpec);
    readSpy.mockRestore();
    writeSpy.mockRestore();
  });
});
