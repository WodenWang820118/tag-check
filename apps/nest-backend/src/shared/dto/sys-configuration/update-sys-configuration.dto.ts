import { PartialType } from '@nestjs/swagger';
import { CreateSysConfigurationDto } from './create-sys-configuration.dto';

export class UpdateSysConfigurationDto extends PartialType(
  CreateSysConfigurationDto
) {}
