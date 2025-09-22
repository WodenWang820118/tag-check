import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express, Response } from 'express';
import { SysConfigurationRepositoryService } from '../../core/repository/sys-configuration/sys-configuration-repository.service';
import { ProjectIoFacadeService } from '../../features/project-agent/project-io-facade/project-io-facade.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { ProjectRepositoryService } from '../../core/repository/project/project-repository.service';

@Controller('projects')
export class ProjectIoController {
  private readonly logger = new Logger(ProjectIoController.name);
  constructor(
    private readonly projectIoFacadeService: ProjectIoFacadeService,
    private readonly configurationSerivce: SysConfigurationRepositoryService,
    private readonly projectRepositoryService: ProjectRepositoryService
  ) {}

  @Get('export/:projectSlug')
  @Log()
  async exportProject(@Param('projectSlug') projectSlug: string) {
    return await this.projectIoFacadeService.exportProject(projectSlug);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        filename: (req, file, callback) => {
          // You can apply logic here to customize the file name
          callback(null, file.originalname);
        }
      }),
      fileFilter: (req, file, callback) => {
        if (!/\.(zip)$/.test(file.originalname)) {
          // Reject the file if it's not a zip
          return callback(new Error('Only zip files are allowed!'), false);
        }
        callback(null, true);
      }
    })
  )
  async importProject(
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response
  ) {
    try {
      const rootProjectPath =
        await this.configurationSerivce.getRootProjectPath();
      // Note: Prefer reading config to determine slug in the future instead of file name
      const importedSlug = await this.projectIoFacadeService.importProject(
        file.originalname.split('.')[0],
        file.path,
        rootProjectPath
      );
      return response.status(200).json({ projectSlug: importedSlug });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('delete/:projectSlug')
  async deleteProject(@Param('projectSlug') projectSlug: string) {
    try {
      await this.projectIoFacadeService.deleteProject(projectSlug);
    } catch (error) {
      this.logger.error(error);
    }
    return await this.projectRepositoryService.deleteBySlug(projectSlug);
  }
}
