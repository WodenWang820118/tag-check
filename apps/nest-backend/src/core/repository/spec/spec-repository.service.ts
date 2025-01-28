import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSpecDto, SpecEntity, UpdateSpecDto } from '../../../shared';

@Injectable()
export class SpecRepositoryService {
  constructor(
    @InjectRepository(SpecEntity)
    private readonly repository: Repository<SpecEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(spec: CreateSpecDto) {
    return this.repository.save(spec);
  }

  async update(spec: UpdateSpecDto) {
    return this.repository.save(spec);
  }
}
