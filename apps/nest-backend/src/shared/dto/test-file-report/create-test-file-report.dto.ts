import { IsNotEmpty } from 'class-validator';
import { TestEventEntity } from '../../entity';

export class CreateTestFileReportDto {
  @IsNotEmpty()
  testEvent!: TestEventEntity;
}
