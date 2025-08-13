import {
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { DatabaseIoService } from '../../infrastructure/os/database-io/database-io.service';

@Controller('db-io')
export class DatabaseIoController {
  private readonly logger = new Logger(DatabaseIoService.name);
  constructor(private readonly databaseIoService: DatabaseIoService) {}

  @Post('dump/:projectSlug')
  async dumpProjectDatabase(
    @Param('projectSlug') projectSlug: string,
    @Query('outputPath') outputPath: string
  ) {
    try {
      return await this.databaseIoService.dumpProjectDatabase(
        projectSlug,
        outputPath
      );
    } catch (error) {
      this.logger.error(`Error dumping database`, error);

      // Type checking for different error types
      if (error instanceof HttpException) {
        // Re-throw NestJS HTTP exceptions
        throw error;
      } else if (error instanceof Error) {
        // Handle standard Error objects
        if (error.message.includes('not found')) {
          throw new NotFoundException(error.message);
        } else {
          throw new InternalServerErrorException(error.message);
        }
      } else {
        // Handle non-Error objects
        throw new InternalServerErrorException('An unknown error occurred');
      }
    }
  }

  @Get('import')
  async importProjectDatabase(@Query('sqlDumpPath') sqlDumpPath: string) {
    try {
      return await this.databaseIoService.importProjectDatabase(sqlDumpPath);
    } catch (error) {
      this.logger.error(`Error importing database`, error);

      // Type checking for different error types
      if (error instanceof HttpException) {
        // Re-throw NestJS HTTP exceptions
        throw error;
      } else if (error instanceof Error) {
        // Handle standard Error objects
        if (error.message.includes('not found')) {
          throw new NotFoundException(error.message);
        } else {
          throw new InternalServerErrorException(error.message);
        }
      } else {
        // Handle non-Error objects
        throw new InternalServerErrorException('An unknown error occurred');
      }
    }
  }
}
