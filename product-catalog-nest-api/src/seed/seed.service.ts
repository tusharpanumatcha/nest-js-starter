import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Category } from '../categories/schemas/category.schema.js';
import { Product } from '../products/schemas/product.schema.js';
import { databaseState } from '../database/database.module.js';

interface SeedData {
  categories: { category: string; isActive?: boolean }[];
  products: {
    productname: string;
    category: string;
    imageName?: string;
    productDescription?: string;
  }[];
}

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  /** The in-memory database starts empty, so fill it with the sample data on every start. */
  async onApplicationBootstrap() {
    if (databaseState.mode !== 'memory') return;
    const counts = await this.seed();
    this.logger.log(
      `IN-MEMORY database loaded with ${counts.categories} categories and ${counts.products} products (data resets when the app restarts)`,
    );
  }

  /**
   * Loads src/data/api-data.json. Records are matched by name, so running it again
   * updates instead of duplicating. With { fresh: true } everything is deleted first.
   */
  async seed(options: { fresh?: boolean } = {}) {
    const file = resolve(process.cwd(), 'src/data/api-data.json');
    const data: SeedData = JSON.parse(readFileSync(file, 'utf8'));

    await Promise.all([this.categoryModel.init(), this.productModel.init()]);

    if (options.fresh) {
      await Promise.all([
        this.categoryModel.deleteMany({}),
        this.productModel.deleteMany({}),
      ]);
    }

    for (const c of data.categories) {
      await this.categoryModel.updateOne(
        { category: c.category },
        { $set: { category: c.category, isActive: c.isActive ?? true } },
        { upsert: true },
      );
    }
    for (const p of data.products) {
      await this.productModel.updateOne(
        { productname: p.productname },
        {
          $set: {
            productname: p.productname,
            category: p.category,
            imageName: p.imageName ?? '',
            productDescription: p.productDescription ?? '',
          },
        },
        { upsert: true },
      );
    }

    const [categories, products] = await Promise.all([
      this.categoryModel.countDocuments(),
      this.productModel.countDocuments(),
    ]);
    return { categories, products };
  }
}
