import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { SpecService } from './spec.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { CreateSpecDto, UpdateSpecDto } from '../../../shared';

@Injectable()
export class ProjectSpecService {
  private readonly logger = new Logger(ProjectSpecService.name);
  constructor(
    private readonly specRepositoryService: SpecRepositoryService,
    private readonly specService: SpecService
  ) {}

  async getProjectSpecs(projectSlug: string) {
    const specs = await this.specRepositoryService.list(projectSlug);

    return {
      projectSlug: projectSlug,
      specs: specs.map((spec) => spec.dataLayerSpec)
    };
  }

  async getSpec(projectSlug: string, eventName: string) {
    const spec = await this.specService.getSpecByEvent(eventName);
    if (!spec) {
      return undefined;
    }
    return spec.dataLayerSpec;
  }

  async addSpec(projectSlug: string, spec: CreateSpecDto) {
    const eventName = spec.rawGtmTag.tag.parameter.find(
      (p) => p.key === 'eventName'
    )?.value;
    if (!eventName) {
      throw new NotAcceptableException('Event name is required');
    }

    await this.specService.addSpec({
      event: eventName,
      eventName: eventName,
      dataLayerSpec: spec.dataLayerSpec,
      rawGtmTag: spec.rawGtmTag
    });

    const projectSpec = await this.getProjectSpecs(projectSlug);
    return projectSpec;
  }

  async updateSpec(projectSlug: string, eventId: string, spec: UpdateSpecDto) {
    const dbSpec = await this.getSpec(projectSlug, eventId);
    if (!dbSpec) {
      throw new NotAcceptableException('Spec not found');
    }

    await this.specService.updateSpec(Number(dbSpec.id), {
      eventName: eventId,
      dataLayerSpec: spec.dataLayerSpec
    });

    const projectSpec = await this.getProjectSpecs(projectSlug);
    return projectSpec;
  }
}
