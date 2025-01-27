import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestInfoEntity } from '../../../shared';

@Injectable()
export class TestInfoRepositoryService {
  constructor(
    @InjectRepository(TestInfoEntity)
    private readonly repository: Repository<TestInfoEntity>
  ) {}
}
