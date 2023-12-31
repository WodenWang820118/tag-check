import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { ProjectModule } from '../project/project.module';
import { ProjectService } from '../project/project.service';
import { ConfigurationModule } from '../../configuration/configuration.module';
import { ConfigurationService } from '../../configuration/configuration.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Configuration } from '../../configuration/entities/configuration.entity';
@Module({
  imports: [
    ProjectModule,
    ConfigurationModule,
    SequelizeModule.forFeature([Configuration]),
  ],
  providers: [FileService, ProjectService, ConfigurationService],
})
export class FileModule {}
