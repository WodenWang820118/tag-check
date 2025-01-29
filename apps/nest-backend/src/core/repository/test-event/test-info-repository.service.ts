import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestInfoDto,
  TestInfoEntity,
  UpdateTestInfoDto
} from '../../../shared';

@Injectable()
export class TestInfoRepositoryService {
  constructor(
    @InjectRepository(TestInfoEntity)
    private readonly repository: Repository<TestInfoEntity>
  ) {}

  async list(id: number) {
    return this.repository.find({ where: { id } });
  }

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateTestInfoDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestInfoDto) {
    return this.repository.save(data);
  }
}
