import { Test } from '@nestjs/testing';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';
import { join } from 'path';
import {
  CONFIG_FOLDER,
  META_DATA,
  RECORDING_FOLDER,
  RESULT_FOLDER,
} from '../../configs/project.config';
import { ProjectRecordingService } from './project-recording.service';

// TODO: should be tested

const moduleMocker = new ModuleMocker(global);

describe('ProjectRecordingService', () => {
  let service: ProjectRecordingService;
  let rootProjectPath: string;

  beforeEach(async () => {
    rootProjectPath = join('..', '..', '..', '..', '..', 'tag_check_projects');

    const moduleRef = await Test.createTestingModule({
      providers: [ProjectRecordingService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    service = moduleRef.get<ProjectRecordingService>(ProjectRecordingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return project recordings', async () => {
    const projectSlug = 'project-slug';
    const result = await service.getProjectRecordings(projectSlug);

    expect(result).toBeDefined();
    expect(result.projectSlug).toBe(projectSlug);
    expect(result.recordings).toBeDefined();
  });
});
