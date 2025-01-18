import { PartialType } from '@nestjs/mapped-types';
import { CreateTestResultDto } from './create-test-result.dto';

export class UpdateUserDto extends PartialType(CreateTestResultDto) {}
