import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { Spec } from '@utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecService } from './spec.service';
import { ProjectEntity } from '../../../shared';

@Injectable()
export class ProjectSpecService {
  private readonly logger = new Logger(ProjectSpecService.name);
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectSpecRepository: Repository<ProjectEntity>,
    private readonly specService: SpecService
  ) {}

  async getProjectSpecs(projectSlug: string) {
    const projectSpec = await this.projectSpecRepository.findOne({
      where: { projectSlug: projectSlug }
    });

    if (!projectSpec) {
      return { projectSlug: projectSlug, specs: [] };
    }

    return { projectSlug: projectSpec.projectSlug, specs: projectSpec };
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
      eventName: spec.event,
      dataLayerSpec: spec
    });

    const projectSpec = await this.getProjectSpecs(projectSlug);
    return projectSpec;
  }

  async updateSpec(projectSlug: string, eventName: string, spec: Spec) {
    const dbSpec = await this.getSpec(projectSlug, eventName);
    if (!dbSpec) {
      throw new NotAcceptableException('Spec not found');
    }

    await this.specService.updateSpec(Number(dbSpec.id), {
      eventName: eventName,
      dataLayerSpec: spec
    });

    const projectSpec = await this.getProjectSpecs(projectSlug);
    return projectSpec;
  }
}
