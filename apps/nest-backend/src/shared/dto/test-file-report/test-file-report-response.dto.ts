import { Exclude, Expose } from 'class-transformer';
import { TestEventEntity } from '../../entity';

@Exclude()
export class TestFileReportResponseDto {
  @Expose()
  id!: number;

  @Expose()
  testEvent!: TestEventEntity;
}
