import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { Spec } from '@utils';
import { SpecService } from './spec.service';
import { SpecRepositoryService } from '../../../core/repository/spec/spec-repository.service';

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

  async addSpec(projectSlug: string, spec: Spec) {
    await this.specService.addSpec({
      event: spec.event,
      eventName: spec.event,
      dataLayerSpec: spec
    });

    const projectSpec = await this.getProjectSpecs(projectSlug);
    return projectSpec;
  }

  async updateSpec(projectSlug: string, eventId: string, spec: Spec) {
    const dbSpec = await this.getSpec(projectSlug, eventId);
    if (!dbSpec) {
      throw new NotAcceptableException('Spec not found');
    }

    await this.specService.updateSpec(Number(dbSpec.id), {
      eventName: eventId,
      dataLayerSpec: spec
    });

    const projectSpec = await this.getProjectSpecs(projectSlug);
    return projectSpec;
  }
}
