import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import type { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/schema-options.js';

@Schema({ ...baseSchemaOptions, collection: 'products' })
export class Product {
  @ApiProperty({ example: '6ac8f3c6fb81da1eeef9df60' })
  id: string;

  @ApiProperty({ example: 'Card Management Suite' })
  @Prop({ required: true, trim: true, maxlength: 200 })
  productname: string;

  /** Category *name* (e.g. "Issuer Solutions") - must match an existing category. */
  @ApiProperty({ example: 'Issuer Solutions' })
  @Prop({ required: true, trim: true, index: true })
  category: string;

  @ApiProperty({ example: 'cardmanagement.jpg' })
  @Prop({ trim: true, default: '' })
  imageName: string;

  @ApiProperty({ example: 'End-to-end card lifecycle management...' })
  @Prop({ trim: true, default: '' })
  productDescription: string;

  @ApiProperty()
  createdDate: Date;

  @ApiProperty()
  updatedDate: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
