import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ProjectSpecService } from '../../features/project-agent/project-spec/project-spec.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { ProjectFacadeRepositoryService } from '../../features/repository/project-facade/project-facade-repository.service';
import { SpecRepositoryService } from '../../core/repository/spec/spec-repository.service';
import { ItemDefRepositoryService } from '../../core/repository/item-def/item-def-repository.service';
import { CreateSpecDto, UpdateItemDefDto, UpdateSpecDto } from '../../shared';

@Controller('specs')
export class SpecController {
  constructor(
    private readonly projectSpecService: ProjectSpecService,
    private readonly projectFacadeRepositoryService: ProjectFacadeRepositoryService,
    private readonly specRepositoryService: SpecRepositoryService,
    private readonly itemDefRepositoryService: ItemDefRepositoryService
  ) {}

  @Get(':projectSlug')
  async getProjectSpecs(@Param('projectSlug') projectSlug: string) {
    return await this.projectSpecService.getProjectSpecs(projectSlug);
  }

  @Get(':itemId/item-def')
  async getItemDef(@Param('itemId') itemId: string) {
    return await this.itemDefRepositoryService.getItemDefById(itemId);
  }

  @Get(':templateName/item-def')
  async getItemDefByTemplateName(@Param('templateName') templateName: string) {
    return await this.itemDefRepositoryService.getItemDefByTemplateName(
      templateName
    );
  }

  @Put(':itemId/item-def')
  async updateItemDef(
    @Param('itemId') itemId: string,
    @Body() updateItemDefDto: UpdateItemDefDto
  ) {
    return await this.itemDefRepositoryService.updateItemDefById(
      itemId,
      updateItemDefDto
    );
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
  async addSpec(
    @Param('projectSlug') projectSlug: string,
    @Body() spec: CreateSpecDto
  ) {
    return await this.projectSpecService.addSpec(projectSlug, spec);
  }

  @Put(':projectSlug/:eventid')
  @Log()
  async updateSpec(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() spec: UpdateSpecDto
  ) {
    return await this.projectFacadeRepositoryService.updateSpec(
      projectSlug,
      eventId,
      spec
    );
  }
}
