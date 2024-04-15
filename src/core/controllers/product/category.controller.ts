import {
  ApiSearchOneParamOptions,
  ApiSearchOneQueryFilter,
  ApiSearchParamOptions,
  ApiSearchQueryFilter,
  CustomApiErrorResponse,
  CustomApiPaginatedResponse,
  Paginated,
} from '@app/nestjs';
import { buildFilterFromApiSearchParams } from '@app/typeorm';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuthJwtHeader } from 'src/modules/auth/decorators/api-auth-jwt-header.decorator';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { CategoryService } from '../../services/product/category.service';
import { Category } from '../../entities/product/category.entity';
import { CreateCategoryDto } from '../../dto/product/create-category.dto';
import { UpdateCategoryDto } from '../../dto/product/update-category.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private service: CategoryService) {}

  /**
   * Get paginated category list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Category)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Category>> {
    // Permission check
   /* await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Category,
    );*/

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['displayName'],
      },
    );

    return this.service.readPaginatedListRecord(options);
  }

  /**
   * Get category by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':categoryId')
  async findOne(
    @Param('categoryId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Category> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });
  }

  /**
   * Create category
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateCategoryDto,
    @Query() query?: any,
  ): Promise<Category> {
    const category = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: category.id },
    });
  }

  /**
   * Update category
   */
  @ApiSearchOneQueryFilter()
  @Patch(':categoryId')
  async update(
    @Param('categoryId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Query() query?: any,
  ): Promise<Category> {
    const category = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: category.id ?? '' },
    });
  }

  /**
   * Remove category
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':categoryId')
  async remove(@Param('categoryId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
