import { PartialType } from '@nestjs/mapped-types';
import { CreateTestInfoDto } from './create-test-info.dto';

export class UpdateTestInfoDto extends PartialType(CreateTestInfoDto) {}
