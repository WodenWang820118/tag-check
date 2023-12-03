import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WaiterService } from './waiter.service';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('waiter-gtm-operator')
export class WaiterGtmOperatorController {
  constructor(private waiterService: WaiterService) {}

  @Get('/single-event')
  @ApiOperation({
    summary: 'Inspects a single event dataLayer with GTM',
    description:
      'This endpoint inspects a single event and automates the process with GTM preview mode.',
  })
  @ApiQuery({
    name: 'gtmUrl',
    description: 'The URL of the GTM preview mode share link.',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiQuery({
    name: 'testName',
    description: 'The name of the test associated with the event.',
  })
  @ApiQuery({
    name: 'headless',
    description: 'Specifies if the test runs in headless mode.',
  })
  @ApiQuery({
    name: 'path',
    required: false,
    description: 'The optional path where the event data is stored.',
  })
  @ApiQuery({
    name: 'username',
    required: false,
    description:
      'Optional username for authentication purposes. If provided, password must also be provided.',
  })
  @ApiQuery({
    name: 'password',
    required: false,
    description: 'Optional password for authentication purposes.',
  })
  @ApiResponse({ status: 200, description: 'The inspected dataLayer results.' })
  async inspectSingleEventViaGtm(
    @Query('gtmUrl') gtmUrl: string,
    @Query('projectName') projectName: string,
    @Query('testName') testName: string,
    @Query('headless') headless?: string,
    @Query('path') path?: string,
    @Query('username') username?: string,
    @Query('password') password?: string
  ) {
    await this.waiterService.inspectSingleEventViaGtm(
      gtmUrl,
      projectName,
      testName,
      headless,
      path,
      {
        username,
        password,
      }
    );
  }
}
