import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Category, type CategoryDocument } from './schemas/category.schema.js';
import { Product } from '../products/schemas/product.schema.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  findAll(filter: { isActive?: boolean } = {}): Promise<CategoryDocument[]> {
    const query: { isActive?: boolean } = {};
    if (typeof filter.isActive === 'boolean') query.isActive = filter.isActive;
    return this.categoryModel.find(query).sort({ category: 1 }).exec();
  }

  findActive(): Promise<CategoryDocument[]> {
    return this.findAll({ isActive: true });
  }

  async findOne(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) throw new NotFoundException(`Category not found: ${id}`);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    await this.assertNameAvailable(dto.category);
    return this.categoryModel.create(dto);
  }

  /** Partial update. Renaming a category also moves its products to the new name. */
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    const category = await this.findOne(id);
    const oldName = category.category;
    if (dto.category !== undefined)
      await this.assertNameAvailable(dto.category, id);

    category.set(dto);
    await category.save();

    if (category.category !== oldName) {
      await this.productModel
        .updateMany(
          { category: oldName },
          { $set: { category: category.category } },
        )
        .exec();
    }
    return category;
  }

  /** Refuses to delete a category that still has products, so no product is left orphaned. */
  async remove(id: string): Promise<CategoryDocument> {
    const category = await this.findOne(id);
    const productCount = await this.productModel
      .countDocuments({ category: category.category })
      .exec();
    if (productCount > 0) {
      throw new ConflictException(
        `Category "${category.category}" still has ${productCount} product(s). ` +
          'Delete or move them first, or set isActive to false instead.',
      );
    }
    await category.deleteOne();
    return category;
  }

  /** Category names are unique (also enforced by a unique index). */
  private async assertNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: { category: string; _id?: { $ne: string } } = {
      category: name.trim(),
    };
    if (excludeId) filter._id = { $ne: excludeId };
    if (await this.categoryModel.exists(filter)) {
      throw new ConflictException(`Category "${name.trim()}" already exists`);
    }
  }
}
