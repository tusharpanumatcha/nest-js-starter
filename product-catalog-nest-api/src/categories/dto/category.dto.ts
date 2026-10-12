import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCategoryDto {
  @ApiProperty({ example: 'Payments', maxLength: 100 })
  // class-validator checks bottom-up; with stopAtFirstError the first failure is reported
  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  @Transform(trim)
  category: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** All fields optional - only the fields sent are changed. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({
    enum: ['true', 'false'],
    description: 'Filter by active state',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  isActive?: 'true' | 'false';
}
