import { Module } from '@nestjs/common';
import { AirtableController } from './airtable.controller';
import { AirtableService } from './airtable.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [AirtableController],
  providers: [AirtableService],
  exports: [AirtableService],
})
export class AirtableModule {}
