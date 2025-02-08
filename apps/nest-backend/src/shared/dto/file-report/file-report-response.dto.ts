import { FileReportSchema } from '@utils';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class FileReportResponseDto implements FileReportSchema {
  @Expose()
  id!: number;

  @Expose()
  fileName!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
