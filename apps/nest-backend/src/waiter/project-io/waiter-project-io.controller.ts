import {
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { WaiterProjectIoService } from './waiter-project-io.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express } from 'express';
import { ConfigurationService } from '../../configuration/configuration.service';

@Controller('projects')
export class WaiterProjectIoController {
  constructor(
    private waiterProjectIoService: WaiterProjectIoService,
    private configurationSerivce: ConfigurationService
  ) {}

  @Get('export/:projectSlug')
  async exportProject(@Param('projectSlug') projectSlug: string) {
    return await this.waiterProjectIoService.exportProject(projectSlug);
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
  async importProject(@UploadedFile() file: Express.Multer.File) {
    Logger.log('called importProject');
    Logger.log('file', file);
    Logger.log('file', file.path);
    const rootProjectPath =
      await this.configurationSerivce.getRootProjectPath();
    await this.waiterProjectIoService.importProject(
      file.originalname.split('.')[0],
      file.path,
      rootProjectPath
    );
    // TODO: consider returning a more meaningful response
    return { message: 'Project imported successfully' };
  }
}
