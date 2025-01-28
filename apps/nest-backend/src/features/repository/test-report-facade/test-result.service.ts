import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TestFileReportEntity } from '../../../shared/entity/test-file-report.entity';
import { In, Repository } from 'typeorm';
import { CreateTestResultDto } from '../../../shared/dto/test-result/create-test-result.dto';
// TODO: replace the service with the another repository service
@Injectable()
export class TestResultService {
  constructor(
    @InjectRepository(TestFileReportEntity)
    private readonly testResultRepository: Repository<TestFileReportEntity>
  ) {}

  async list(projectSlug: string) {
    return await this.testResultRepository.find();
  }

  async get(projectSlug: string, eventId: string) {
    return await this.testResultRepository.findOne({});
  }

  async getMany(projectSlug: string, eventIds: string[]) {
    return await this.testResultRepository.find({});
  }

  async create(testResultDto: Partial<CreateTestResultDto>) {
    const testResult = this.testResultRepository.create(testResultDto);
    return await this.testResultRepository.save(testResult);
  }

  async delete(projectSlug: string, eventId: string) {
    return await this.testResultRepository.delete({ id: 1 });
  }

  async deleteMany(projectSlug: string, eventIds: string[]) {
    return await this.testResultRepository.delete({});
  }
}
