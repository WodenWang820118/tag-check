import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SpecEntity, CreateSpecDto } from '../../../shared';
import { Repository } from 'typeorm';

/** Saves specs that are not attached to a test (POST /specs/:projectSlug). */
@Injectable()
export class SpecService {
  constructor(
    @InjectRepository(SpecEntity)
    private readonly specRepository: Repository<SpecEntity>
  ) {}

  async addSpec(createSpecDto: CreateSpecDto): Promise<SpecEntity> {
    const spec = this.specRepository.create(createSpecDto);
    return this.specRepository.save(spec);
  }
}
