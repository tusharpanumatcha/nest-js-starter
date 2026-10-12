import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { Category } from './schemas/category.schema.js';
import {
  CreateCategoryDto,
  ListCategoriesQueryDto,
  UpdateCategoryDto,
} from './dto/category.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

@ApiTags('categories')
@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List categories (optionally filtered by isActive)',
  })
  @ApiOkResponse({ type: [Category] })
  findAll(@Query() query: ListCategoriesQueryDto) {
    const isActive =
      query.isActive === undefined ? undefined : query.isActive === 'true';
    return this.categoriesService.findAll({ isActive });
  }

  @Get('active')
  @ApiOperation({ summary: 'List active categories' })
  @ApiOkResponse({ type: [Category] })
  findActive() {
    return this.categoriesService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one category' })
  @ApiOkResponse({ type: Category })
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ type: Category })
  @ApiConflictResponse({ description: 'Category name already exists' })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category (partial)' })
  @ApiOkResponse({ type: Category })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category (partial)' })
  @ApiOkResponse({ type: Category })
  patch(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a category (409 if it still has products)' })
  @ApiConflictResponse({ description: 'Category still has products' })
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    const category = await this.categoriesService.remove(id);
    return { message: 'Category deleted', category };
  }
}
