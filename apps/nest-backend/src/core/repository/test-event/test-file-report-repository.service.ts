import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestFileReportDto,
  TestFileReportEntity,
  UpdateTestFileReportDto
} from '../../../shared';

@Injectable()
export class TestFileReportRepositoryService {
  constructor(
    @InjectRepository(TestFileReportEntity)
    private readonly repository: Repository<TestFileReportEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateTestFileReportDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestFileReportDto) {
    return this.repository.save(data);
  }
}
