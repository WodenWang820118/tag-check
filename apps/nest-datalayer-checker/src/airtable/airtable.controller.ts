import { Controller, Get, Param, Query, Injectable } from '@nestjs/common';
import { AirtableService } from './airtable.service';

@Controller('airtable')
@Injectable()
export class AirtableController {
  constructor(private readonly service: AirtableService) {}

  @Get('/:baseId/:tableId')
  getRecords(
    @Param('baseId') baseId: string,
    @Param('tableId') tableId: string,
    @Query('token') token: string,
  ) {
    return this.service.getRecords(baseId, tableId, token);
  }

  @Get('/:baseId/:tableId/:viewId')
  getView(
    @Param('baseId') baseId: string,
    @Param('tableId') tableId: string,
    @Param('viewId') viewId: string,
    @Query('token') token: string,
  ) {
    return this.service.getView(baseId, tableId, viewId, token);
  }
}
