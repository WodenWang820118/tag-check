import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateSpecDto,
  SpecEntity,
  SpecResponseDto,
  TestEventEntity,
  UpdateSpecDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SpecRepositoryService {
  constructor(
    @InjectRepository(SpecEntity)
    private readonly repository: Repository<SpecEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(SpecResponseDto, entity);
  }

  async create(testEventEntity: TestEventEntity, spec: CreateSpecDto) {
    const specEntity = new SpecEntity();
    specEntity.testEvent = testEventEntity;
    specEntity.eventName = spec.eventName;
    specEntity.dataLayerSpec = spec.dataLayerSpec;
    const entity = await this.repository.save(specEntity);
    return plainToInstance(SpecResponseDto, entity);
  }

  async update(spec: UpdateSpecDto) {
    const entity = await this.repository.save(spec);
    return plainToInstance(SpecResponseDto, entity);
  }
}
