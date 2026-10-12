import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Accepts ?category=A&category=B or ?category=A,B and returns ['A', 'B']. */
const toList = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
    .map((v) => (typeof v === 'string' ? v.trim() : v))
    .filter((v) => v !== '');
};

export class CreateProductDto {
  @ApiProperty({ example: 'Pay Gateway', maxLength: 200 })
  // class-validator checks bottom-up; with stopAtFirstError the first failure is reported
  @MaxLength(200)
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  productname: string;

  @ApiProperty({
    example: 'Issuer Solutions',
    description: 'Name of an existing category',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  category: string;

  @ApiPropertyOptional({ example: 'paygateway.jpg' })
  @IsOptional()
  @IsString()
  imageName?: string;

  @ApiPropertyOptional({ example: 'Accepts card and wallet payments online.' })
  @IsOptional()
  @IsString()
  productDescription?: string;
}

/** All fields optional - only the fields sent are changed. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Category name(s): ?category=A&category=B or ?category=A,B',
  })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({
    description: 'Case-insensitive search in the product name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class SearchProductsDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['Issuer Solutions', 'Digital Security'],
    description: 'Category names. An empty or missing list returns [].',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ example: 'card' })
  @IsOptional()
  @IsString()
  search?: string;
}
