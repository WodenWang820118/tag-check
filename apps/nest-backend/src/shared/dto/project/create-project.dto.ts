import { Project } from '@utils';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto implements Project {
  @IsNotEmpty()
  @IsString()
  projectSlug!: string;

  @IsNotEmpty()
  @IsString()
  projectName!: string;

  @IsOptional()
  @IsString()
  projectDescription?: string;

  @IsOptional()
  @IsString()
  measurementId?: string;
}
