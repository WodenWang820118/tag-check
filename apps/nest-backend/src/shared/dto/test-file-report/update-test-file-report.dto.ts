import { PartialType } from '@nestjs/mapped-types';
import { CreateTestFileReportDto } from './create-test-file-report.dto';

export class UpdateTestFileReportDto extends PartialType(
  CreateTestFileReportDto
) {}
