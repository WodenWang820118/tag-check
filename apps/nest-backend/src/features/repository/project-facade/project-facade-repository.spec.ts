import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectFacadeRepositoryService } from './project-facade-repository.service';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ProjectEntity,
  ProjectInfoEntity,
  RecordingEntity,
  SpecEntity,
  TestEventEntity
} from '../../../shared';
import { ProjectInfoRepositoryService } from '../../../core/repository/project/project-info-repository.service';
import { ProjectRepositoryService } from '../../../core/repository/project/project-repository.service';
import { RecordingRepositoryService } from '../../../core/repository/recording/recording-repository.service';
import { ApplicationSettingRepositoryService } from '../../../core/repository/settings/application-setting-repository.service';
import { AuthenticationSettingRepositoryService } from '../../../core/repository/settings/authentication-setting-repository.service';
import { BrowserSettingRepositoryService } from '../../../core/repository/settings/browser-setting-repository.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { vi } from 'vitest';

describe('ProjectFacadeRepositoryService', () => {
  let service: ProjectFacadeRepositoryService;
  let module: TestingModule;

  beforeAll(() => {
    // Increase the timeout for the initial setup
    vi.setConfig({ testTimeout: 30000 });
  });

  const createTestingModule = async () => {
    return await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            ProjectEntity,
            ProjectInfoEntity,
            AuthenticationSettingEntity,
            BrowserSettingEntity,
            ApplicationSettingEntity,
            RecordingEntity,
            SpecEntity,
            TestEventEntity
          ],
          synchronize: true,
          dropSchema: true,
          logging: false
        }),
        TypeOrmModule.forFeature([
          ProjectEntity,
          ProjectInfoEntity,
          AuthenticationSettingEntity,
          BrowserSettingEntity,
          ApplicationSettingEntity,
          RecordingEntity,
          SpecEntity
        ])
      ],
      providers: [
        ProjectFacadeRepositoryService,
        ProjectRepositoryService,
        ProjectInfoRepositoryService,
        AuthenticationSettingRepositoryService,
        BrowserSettingRepositoryService,
        ApplicationSettingRepositoryService,
        RecordingRepositoryService,
        SpecRepositoryService
      ]
    }).compile();
  };

  beforeEach(async () => {
    module = await createTestingModule();
    service = module.get<ProjectFacadeRepositoryService>(
      ProjectFacadeRepositoryService
    );
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should create a project with all related entities', async () => {
    const projectSlug = 'test-project';
    const settings = {
      projectName: 'Test Project',
      projectDescription: 'Test Description',
      measurementId: 'TEST-123'
    };

    await service.createProject(projectSlug, settings);

    // Get the repositories to verify the created entities
    const projectRepo = module.get(ProjectRepositoryService);
    const projectInfoRepo = module.get(ProjectInfoRepositoryService);
    const authRepo = module.get(AuthenticationSettingRepositoryService);
    const browserRepo = module.get(BrowserSettingRepositoryService);
    const appRepo = module.get(ApplicationSettingRepositoryService);
    const recordingRepo = module.get(RecordingRepositoryService);
    const specRepo = module.get(SpecRepositoryService);

    // Verify all entities were created
    const project = await projectRepo.get(1);
    expect(project).toBeDefined();
    expect(project?.projectSlug).toBe(projectSlug);

    const projectInfo = await projectInfoRepo.get(1);
    expect(projectInfo).toBeDefined();
    expect(projectInfo?.projectName).toBe(settings.projectName);

    const authSetting = await authRepo.get(1);
    expect(authSetting).toBeDefined();

    const browserSetting = await browserRepo.get(1);
    expect(browserSetting).toBeDefined();
    expect(browserSetting?.headless).toBe(true);

    const appSetting = await appRepo.get(1);
    expect(appSetting).toBeDefined();

    const recording = await recordingRepo.get(1);
    expect(recording).toBeDefined();
    expect(recording?.title).toBe('page_view');

    const spec = await specRepo.get(1);
    expect(spec).toBeDefined();
    expect(spec?.event).toBe('page_view');
  });
});
