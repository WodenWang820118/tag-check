import { PartialType } from '@nestjs/mapped-types';
import { CreateTestResultDto } from './create-test-result.dto';

export class UpdateTestResultDto extends PartialType(CreateTestResultDto) {}
