import { PartialType } from '@nestjs/mapped-types';
import { CreateTestRequestInfoDto } from './create-test-request-info.dto';

export class UpdateTestRequestInfoDto extends PartialType(
  CreateTestRequestInfoDto
) {}
