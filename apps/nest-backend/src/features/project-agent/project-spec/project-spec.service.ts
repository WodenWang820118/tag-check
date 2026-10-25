import { Injectable, NotAcceptableException } from '@nestjs/common';
import { SpecService } from './spec.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';
import { CreateSpecDto } from '../../../shared';

/** Lists a project's specs and adds a spec from a GTM tag. */
@Injectable()
export class ProjectSpecService {
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

  /**
   * Saves the spec under the tag's `eventName` parameter.
   *
   * @returns The project's specs afterwards.
   * @throws NotAcceptableException when the tag has no eventName.
   */
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
}
