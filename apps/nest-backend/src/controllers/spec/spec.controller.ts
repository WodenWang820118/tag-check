import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ProjectSpecService } from '../../features/project-agent/project-spec/project-spec.service';
import { ProjectFacadeRepositoryService } from '../../features/repository/project-facade/project-facade-repository.service';
import { SpecRepositoryService } from '../../core/repository/spec/spec-repository.service';
import { ItemDefRepositoryService } from '../../core/repository/item-def/item-def-repository.service';
import { CreateSpecDto, UpdateItemDefDto, UpdateSpecDto } from '../../shared';

/** Reads and edits tests' specs and item definitions. */
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

  /** The item definition of one test, or null when it has none. */
  @Get(':projectSlug/:eventId/item-def')
  async getItemDef(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string
  ) {
    return await this.itemDefRepositoryService.getItemDefByProjectSlugAndEventId(
      projectSlug,
      eventId
    );
  }

  /** Updates one test's item definition, or creates it if it has none. */
  @Put(':projectSlug/:eventId/item-def')
  async saveItemDef(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() updateItemDefDto: UpdateItemDefDto
  ) {
    return await this.itemDefRepositoryService.saveItemDefByProjectSlugAndEventId(
      projectSlug,
      eventId,
      updateItemDefDto
    );
  }

  @Get(':projectSlug/:eventId')
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
  async addSpec(
    @Param('projectSlug') projectSlug: string,
    @Body() spec: CreateSpecDto
  ) {
    return await this.projectSpecService.addSpec(projectSlug, spec);
  }

  @Put(':projectSlug/:eventId')
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
