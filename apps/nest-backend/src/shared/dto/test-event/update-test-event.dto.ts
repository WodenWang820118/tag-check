import { PartialType } from '@nestjs/mapped-types';
import { CreateTestEventDto } from './create-test-event.dto';

export class UpdateTestEventDto extends PartialType(CreateTestEventDto) {}
