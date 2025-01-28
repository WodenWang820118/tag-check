import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectInfoDto } from './create-project-info.dto';

export class UpdateProjectInfoDto extends PartialType(CreateProjectInfoDto) {}
