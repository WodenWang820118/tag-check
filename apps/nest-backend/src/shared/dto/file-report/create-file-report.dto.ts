import { FileReport } from '@utils';
import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@Exclude()
export class CreateFileReportDto implements FileReport {
  @IsNotEmpty()
  @IsString()
  fileName!: string;
}
