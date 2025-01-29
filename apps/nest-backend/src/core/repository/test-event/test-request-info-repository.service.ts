import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestRequestInfoDto,
  TestRequestInfoEntity,
  UpdateTestRequestInfoDto
} from '../../../shared';

@Injectable()
export class TestRequestInfoRepositoryService {
  constructor(
    @InjectRepository(TestRequestInfoEntity)
    private readonly repository: Repository<TestRequestInfoEntity>
  ) {}

  async list(id: number) {
    return this.repository.find({ where: { id } });
  }

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateTestRequestInfoDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestRequestInfoDto) {
    return this.repository.save(data);
  }
}
