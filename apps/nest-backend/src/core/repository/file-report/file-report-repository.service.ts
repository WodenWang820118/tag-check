import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateFileReportDto,
  FileReportEntity,
  FileReportResponseDto,
  TestEventEntity
} from '../../../shared';
import { In, Repository } from 'typeorm';
import { FileReport } from '@utils';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class FileReportRepositoryService {
  constructor(
    @InjectRepository(FileReportEntity)
    private repository: Repository<FileReportEntity>,
    @InjectRepository(TestEventEntity)
    private testEventRepository: Repository<TestEventEntity>
  ) {}

  // Create a new file report
  async createFileReport(
    createFileReportDto: CreateFileReportDto
  ): Promise<FileReport> {
    const fileReport = this.repository.create(createFileReportDto);
    const entity = await this.repository.save(fileReport);
    return plainToInstance(FileReportResponseDto, entity);
  }

  // Associate test events with a file report
  async associateTestEvents(
    projectSlug: string,
    fileReportId: number,
    testEventIds: number[]
  ): Promise<FileReport> {
    const fileReport = await this.repository.findOne({
      relations: {
        testEvents: {
          project: true
        }
      },
      where: { id: fileReportId, project: { projectSlug } }
    });

    if (!fileReport) {
      throw new HttpException('File report not found', HttpStatus.NOT_FOUND);
    }
    const testEvents = await this.testEventRepository.find({
      where: {
        project: { projectSlug },
        id: In(testEventIds)
      }
    });

    fileReport.testEvents = testEvents;
    const entity = await this.repository.save(fileReport);
    return plainToInstance(FileReportResponseDto, entity);
  }

  // Get file report with associated test events
  async getFileReportWithEvents(id: number): Promise<FileReport> {
    const fileReport = await this.repository.findOne({
      relations: {
        testEvents: true
      },
      where: { id }
    });

    if (!fileReport) {
      throw new NotFoundException('File report not found');
    }

    return plainToInstance(FileReportResponseDto, fileReport);
  }
}
