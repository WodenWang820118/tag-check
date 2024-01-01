import { Test, TestingModule } from '@nestjs/testing';
import { SharedService } from './os.service';
import { ProjectService } from './project/project.service';
import { FileService } from './file/file.service';
import { XlsxReportService } from './xlsx-report/xlsx-report.service';

describe('SharedService', () => {
  let service: SharedService;
  let projectService: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedService,
        ProjectService,
        {
          provide: FileService,
          useValue: {},
        },
        {
          provide: XlsxReportService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SharedService>(SharedService);
    projectService = module.get<ProjectService>(ProjectService);
  });

  it('should initProject', () => {
    const initProjectSpy = jest.spyOn(projectService, 'initProject');
    service.initProject('test-project');
    expect(initProjectSpy).toHaveBeenCalledTimes(1);
  });
});
