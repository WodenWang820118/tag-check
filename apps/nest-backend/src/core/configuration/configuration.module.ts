import { Module } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuration } from './entities/configuration.entity';
import { ConfigsModule } from '../configs/configs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Configuration]), // Register the entity for this module
    ConfigsModule
  ],
  providers: [ConfigurationService],
  exports: [TypeOrmModule.forFeature([Configuration]), ConfigurationService]
})
export class ConfigurationModule {}
