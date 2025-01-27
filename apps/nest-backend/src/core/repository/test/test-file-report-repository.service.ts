import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestFileReportEntity } from '../../../shared';

@Injectable()
export class TestFileReportRepositoryService {
  constructor(
    @InjectRepository(TestFileReportEntity)
    private readonly repository: Repository<TestFileReportEntity>
  ) {}
}
