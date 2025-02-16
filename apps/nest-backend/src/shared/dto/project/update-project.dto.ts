import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import {
  ApplicationSetting,
  AuthenticationSetting,
  BrowserSetting
} from '@utils';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
