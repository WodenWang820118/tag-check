import { PartialType } from '@nestjs/mapped-types';
import { CreateRecordingDto } from './create-recording.dto';

export class UpdateRecordingDto extends PartialType(CreateRecordingDto) {}
