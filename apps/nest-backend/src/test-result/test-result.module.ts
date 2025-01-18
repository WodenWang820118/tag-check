import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigsModule } from '../configs/configs.module';
import { TestResultService } from './test-result.service';
import { TestResult } from './entity/test-result.entity';
@Module({
  imports: [TypeOrmModule.forFeature([TestResult]), ConfigsModule],
  providers: [TestResultService],
  exports: [TypeOrmModule.forFeature([TestResult]), TestResultService]
})
export class TestResultModule {}
