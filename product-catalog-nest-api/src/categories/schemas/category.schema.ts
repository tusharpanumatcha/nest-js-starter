import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import type { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/schema-options.js';

@Schema({ ...baseSchemaOptions, collection: 'categories' })
export class Category {
  @ApiProperty({ example: '6ac8f3c6fb81da1eeef9df56' })
  id: string;

  @ApiProperty({ example: 'Issuer Solutions' })
  @Prop({ required: true, trim: true, unique: true, maxlength: 100 })
  category: string;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty()
  createdDate: Date;

  @ApiProperty()
  updatedDate: Date;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);
