import { PartialType } from '@nestjs/mapped-types';
import { CreateTestEventDetailDto } from './create-test-event-detail.dto';

export class UpdateTestEventDetailDto extends PartialType(
  CreateTestEventDetailDto
) {}
