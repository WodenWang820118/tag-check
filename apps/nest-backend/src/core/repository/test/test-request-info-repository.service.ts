import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRequestInfoEntity } from '../../../shared';

@Injectable()
export class TestRequestInfoRepositoryService {
  constructor(
    @InjectRepository(TestRequestInfoEntity)
    private readonly repository: Repository<TestRequestInfoEntity>
  ) {}
}
