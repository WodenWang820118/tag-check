import { Exclude, Expose } from 'class-transformer';
import { ProjectInfoSchema } from '@utils';

@Exclude()
export class ProjectInfoResponseDto implements ProjectInfoSchema {
  @Expose()
  id!: number;

  @Expose()
  projectName!: string;

  @Expose()
  projectDescription!: string;

  @Expose()
  measurementId!: string;

  @Expose()
  updatedAt?: Date | undefined;
  @Expose()
  createdAt!: Date;
}
