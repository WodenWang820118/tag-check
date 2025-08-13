import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ProjectSpecService } from '../../features/project-agent/project-spec/project-spec.service';
import { Spec } from '@utils';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { ProjectFacadeRepositoryService } from '../../features/repository/project-facade/project-facade-repository.service';
import { SpecRepositoryService } from '../../core/repository/spec/spec-repository.service';

@Controller('specs')
export class SpecController {
  constructor(
    private readonly projectSpecService: ProjectSpecService,
    private readonly projectFacadeRepositoryService: ProjectFacadeRepositoryService,
    private readonly specRepositoryService: SpecRepositoryService
  ) {}

  @Get(':projectSlug')
  async getProjectSpecs(@Param('projectSlug') projectSlug: string) {
    return await this.projectSpecService.getProjectSpecs(projectSlug);
  }

  @Get(':projectSlug/:eventId')
  @Log()
  async getSpec(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.specRepositoryService.getSpecByProjectSlugAndEventId(
      projectSlug,
      eventId
    );
  }

  @Post(':projectSlug')
  @Log()
  async addSpec(@Param('projectSlug') projectSlug: string, @Body() spec: Spec) {
    return await this.projectSpecService.addSpec(projectSlug, spec);
  }

  @Put(':projectSlug/:eventid')
  @Log()
  async updateSpec(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() spec: Spec
  ) {
    return await this.projectFacadeRepositoryService.updateSpec(
      projectSlug,
      eventId,
      spec
    );
  }
}
