import { PartialType } from '@nestjs/mapped-types';
import { CreateFileReportDto } from './create-file-report.dto';

export class UpdateFileReportDto extends PartialType(CreateFileReportDto) {}
