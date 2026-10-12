import { Controller, Get, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { Connection } from 'mongoose';
import { RoutesService } from './routes.service.js';
import { packageInfo } from '../common/package-info.js';
import { databaseState } from '../database/database.module.js';

@ApiTags('info')
@Controller()
export class InfoController {
  constructor(
    private readonly routes: RoutesService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get(['/', 'api'])
  @ApiOperation({
    summary: 'API name, version, description and every available endpoint',
  })
  info() {
    return {
      message: 'Product Catalog API',
      name: packageInfo.name,
      version: packageInfo.version,
      description: packageInfo.description,
      docs: '/api/docs',
      endpoints: this.routes.list().map((r) => `${r.method} ${r.path}`),
    };
  }

  @Get('api/health')
  @ApiOperation({
    summary: 'Health check (503 when the database is not connected)',
  })
  health(@Res({ passthrough: true }) res: Response) {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const db = states[this.connection.readyState] ?? 'unknown';
    res.status(db === 'connected' ? 200 : 503);
    return { status: 'ok', db, mode: databaseState.mode };
  }
}
