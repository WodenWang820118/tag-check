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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express, Response } from 'express';
import { ConfigurationService } from '../../configuration/configuration.service';
import { ProjectIoFacadeService } from '../../project-agent/project-io-facade/project-io-facade.service';

@Controller('projects')
export class WaiterProjectIoController {
  constructor(
    private projectIoFacadeService: ProjectIoFacadeService,
    private configurationSerivce: ConfigurationService
  ) {}

  @Get('export/:projectSlug')
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
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(zip)$/)) {
          // Reject the file if it's not a zip
          return callback(new Error('Only zip files are allowed!'), false);
        }
        callback(null, true);
      },
    })
  )
  async importProject(
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response
  ) {
    try {
      Logger.log(
        'called importProject',
        `${WaiterProjectIoController.name}.${WaiterProjectIoController.prototype.importProject.name}`
      );
      Logger.log(
        'file: ' + file,
        `${WaiterProjectIoController.name}.${WaiterProjectIoController.prototype.importProject.name}`
      );
      Logger.log(
        'file.path: ' + file.path,
        `${WaiterProjectIoController.name}.${WaiterProjectIoController.prototype.importProject.name}`
      );
      const rootProjectPath =
        await this.configurationSerivce.getRootProjectPath();
      await this.projectIoFacadeService.importProject(
        file.originalname.split('.')[0],
        file.path,
        rootProjectPath
      );
      return response;
    } catch (error) {
      Logger.error(
        error,
        `${WaiterProjectIoController.name}.${WaiterProjectIoController.prototype.importProject.name}`
      );
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('delete/:projectSlug')
  async deleteProject(@Param('projectSlug') projectSlug: string) {
    return await this.projectIoFacadeService.deleteProject(projectSlug);
  }
}
