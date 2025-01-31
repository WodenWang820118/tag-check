import { PartialType } from '@nestjs/mapped-types';
import { CreateTestEventDetailDto } from './create-test-event-detail.dto';

export class UpdateTestDetailEventDto extends PartialType(
  CreateTestEventDetailDto
) {}
