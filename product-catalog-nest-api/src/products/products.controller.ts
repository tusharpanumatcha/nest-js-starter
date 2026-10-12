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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { Product } from './schemas/product.schema.js';
import {
  CreateProductDto,
  ListProductsQueryDto,
  SearchProductsDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

@ApiTags('products')
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List products (filter by category and/or search by name)',
  })
  @ApiOkResponse({ type: [Product] })
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll({
      categories: query.category,
      search: query.search,
    });
  }

  @Post('search')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Filter products by a list of category names (empty list returns [])',
  })
  @ApiOkResponse({ type: [Product] })
  search(@Body() dto: SearchProductsDto) {
    const categories = (dto.categories ?? [])
      .map((c) => c.trim())
      .filter(Boolean);
    if (categories.length === 0) return [];
    return this.productsService.findAll({ categories, search: dto.search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one product' })
  @ApiOkResponse({ type: Product })
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ type: Product })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed or category does not exist',
  })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product (partial)' })
  @ApiOkResponse({ type: Product })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (partial)' })
  @ApiOkResponse({ type: Product })
  patch(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a product' })
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    const product = await this.productsService.remove(id);
    return { message: 'Product deleted', product };
  }
}
