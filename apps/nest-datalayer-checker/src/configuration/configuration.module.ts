import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Configuration } from './entities/configuration.entity';

@Module({
  imports: [SequelizeModule.forFeature([Configuration])],
  providers: [ConfigurationService],
  exports: [SequelizeModule.forFeature([Configuration]), ConfigurationService],
})
export class ConfigurationModule {}
