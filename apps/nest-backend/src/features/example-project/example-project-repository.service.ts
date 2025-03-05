import { Injectable, Logger } from '@nestjs/common';
import { ProjectFacadeRepositoryService } from '../repository/project-facade/project-facade-repository.service';
import { CreateFullTestEventDto, CreateProjectDto } from '../../shared';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';
import { IReportDetails, Recording, Spec } from '@utils';
import { exampleRecording } from './example-recording';
import { exampleSpec } from './example-spec';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';

@Injectable()
export class ExampleProjectRepositoryService {
  private logger = new Logger(ExampleProjectRepositoryService.name);
  constructor(
    private readonly projectFacadeRepositoryService: ProjectFacadeRepositoryService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService,
    private readonly projectRepositoryService: ProjectRepositoryService
  ) {
    void this.buildExampleProject();
  }

  async buildExampleProject() {
    this.logger.debug('Building example project');
    try {
      const projects = await this.projectRepositoryService.list();
      if (projects.length > 0) return;
      // 1. create a project with basic settings
      // It will create other settings like authentication, browser, application, recording, spec, test event
      const projectSlug = 'example-project-slug';
      const eventId = '5dfb6b1f-3496-4862-81f6-87bdccfb0be4';

      const createProjectDto: CreateProjectDto = {
        projectSlug: projectSlug,
        projectName: 'Example Project',
        projectDescription: 'This is an example project'
      };
      await this.projectFacadeRepositoryService.createProject(createProjectDto);

      // 2. create a full test event
      const reportDetail: IReportDetails = {
        position: 0,
        event: 'page_view',
        eventName: 'page_view',
        testName: 'Standard Page View',
        eventId: eventId,
        stopNavigation: false,
        message: 'This is a standard page view test',
        passed: false,
        requestPassed: false,
        rawRequest: '',
        destinationUrl: '',
        dataLayer: {},
        reformedDataLayer: {},
        createdAt: new Date()
      };

      const recording: Recording = {
        ...exampleRecording
      };

      const spec: Spec = {
        ...exampleSpec
      };

      const fullReport: CreateFullTestEventDto = {
        reportDetails: reportDetail,
        recording: recording,
        spec: spec
      };

      await this.testReportFacadeRepositoryService.createFullReport(
        projectSlug,
        eventId,
        fullReport
      );
    } catch (error) {
      this.logger.error('Failed to build example project:', error);
      throw error;
    }
  }
}
