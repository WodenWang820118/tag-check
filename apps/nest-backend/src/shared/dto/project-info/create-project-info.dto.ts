import { ProjectInfo } from '@utils';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectInfoDto implements ProjectInfo {
  @IsNotEmpty()
  @IsString()
  projectName!: string;

  @IsString()
  @IsOptional()
  projectDescription?: string;

  @IsString()
  @IsOptional()
  measurementId?: string;
}
