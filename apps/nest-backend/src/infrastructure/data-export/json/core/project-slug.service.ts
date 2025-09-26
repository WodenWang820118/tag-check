import { Injectable, Logger } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';

@Injectable()
export class ProjectSlugService {
  private readonly logger = new Logger(ProjectSlugService.name);

  async ensureUnique(
    repo: Repository<ObjectLiteral>,
    baseSlug: string
  ): Promise<string> {
    if (!baseSlug) return baseSlug;
    let candidate = baseSlug;
    let counter = 1;
    while (true) {
      const found = await repo.findOne({
        where: { projectSlug: candidate } as Record<string, unknown>
      });
      if (!found) return candidate;
      counter++;
      candidate = `${baseSlug}-${counter}`;
      if (counter > 1000) {
        this.logger.warn(
          'Exceeded slug uniqueness attempts; using timestamp suffix'
        );
        return `${baseSlug}-${Date.now()}`;
      }
    }
  }
}
