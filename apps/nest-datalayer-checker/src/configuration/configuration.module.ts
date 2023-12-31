import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Configuration } from './entities/configuration.entity';

@Module({
  imports: [SequelizeModule.forFeature([Configuration])],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
