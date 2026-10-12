import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { InfoController } from './info.controller.js';
import { RoutesService } from './routes.service.js';

@Module({
  imports: [DiscoveryModule],
  controllers: [InfoController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class InfoModule {}
