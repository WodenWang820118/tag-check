import { Controller, Get, Header, Query } from '@nestjs/common';
import { WaiterProjectDataRetrievalService } from './waiter-project-data-retrieval.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('projects')
export class WaiterProjectDataRetrievalController {
  constructor(
    private waiterProjectDataRetrievalService: WaiterProjectDataRetrievalService
  ) {}

  @ApiOperation({
    summary: 'read an image from a specifc project',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiQuery({
    name: 'testName',
    description: 'The name of the test associated with the event.',
  })
  @Get('/read-image')
  @Header('Content-Type', 'image/png')
  async readImage(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string
  ) {
    return await this.waiterProjectDataRetrievalService.readImage(
      projectName,
      testName
    );
  }

  @ApiOperation({
    summary: 'read a report from a specifc project',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiQuery({
    name: 'reportName',
    description: 'The exact report name associated with the event.',
  })
  @Get('/read-report')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  async readReport(
    @Query('projectName') projectName: string,
    @Query('reportName') reportName: string
  ) {
    return await this.waiterProjectDataRetrievalService.readReport(
      projectName,
      reportName
    );
  }

  @ApiOperation({
    summary: 'read report(s) from a specifc project',
    description:
      'This endpoint reads report(s) from a specifc project. \
      If multiple reports are found, it will return an array of report names.',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiQuery({
    name: 'testName',
    description: 'The name of the test associated with the event.',
  })
  @Get('/projects/event-report')
  async getEventReport(
    @Query('projectName') projectName: string,
    @Query('testName') testName: string
  ) {
    return await this.waiterProjectDataRetrievalService.getEventReport(
      projectName,
      testName
    );
  }
}
