import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { SeedModule } from './seed/seed.module.js';
import { InfoModule } from './info/info.module.js';

@Module({
  imports: [
    DatabaseModule,
    CategoriesModule,
    ProductsModule,
    SeedModule,
    InfoModule,
  ],
})
export class AppModule {}
