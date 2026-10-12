import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Product, type ProductDocument } from './schemas/product.schema.js';
import { Category } from '../categories/schemas/category.schema.js';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';

export interface ProductFilter {
  categories?: string[];
  search?: string;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  /** Lists products, optionally filtered by category names and/or a product-name search. */
  findAll(filter: ProductFilter = {}): Promise<ProductDocument[]> {
    const query: {
      category?: { $in: string[] };
      productname?: { $regex: string; $options: string };
    } = {};
    const categories = (filter.categories ?? [])
      .map((c) => c.trim())
      .filter(Boolean);
    if (categories.length > 0) query.category = { $in: categories };
    if (filter.search?.trim()) {
      query.productname = {
        $regex: escapeRegex(filter.search.trim()),
        $options: 'i',
      };
    }
    return this.productModel.find(query).sort({ createdDate: 1 }).exec();
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException(`Product not found: ${id}`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    await this.assertCategoryExists(dto.category);
    return this.productModel.create(dto);
  }

  /** Partial update: only the fields sent are changed. */
  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.findOne(id);
    if (dto.category !== undefined)
      await this.assertCategoryExists(dto.category);
    product.set(dto);
    await product.save();
    return product;
  }

  async remove(id: string): Promise<ProductDocument> {
    const product = await this.findOne(id);
    await product.deleteOne();
    return product;
  }

  /** A product's category must match an existing category name. */
  private async assertCategoryExists(category: string): Promise<void> {
    const exists = await this.categoryModel.exists({
      category: category.trim(),
    });
    if (!exists) {
      throw new UnprocessableEntityException(
        `category "${category}" does not exist. Create it first via POST /api/categories.`,
      );
    }
  }
}
