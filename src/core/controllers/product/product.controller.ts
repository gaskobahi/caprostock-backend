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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { merge } from 'lodash';
import { ApiAuthJwtHeader } from 'src/modules/auth/decorators/api-auth-jwt-header.decorator';
import { ApiRequestIssuerHeader } from 'src/modules/auth/decorators/api-request-issuer-header.decorator';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { AuthUser } from '../../entities/session/auth-user.entity';
import { ProductService } from '../../services/product/product.service';
import { Product } from '../../entities/product/product.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  imageFileFilter,
  limitsParams,
  storageproducts,
} from 'src/helpers/imageStorage';
import { In } from 'typeorm';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('product')
@Controller('product')
export class ProductController {
  constructor(private service: ProductService) {}

  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Product)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Product>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Product,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference', 'displayName'],
      },
    );
    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readPaginatedListRecord(
      options,
      query.page,
      query.perPage,
    );
  }

  @ApiSearchQueryFilter()
  @Get('/list/forcomposite')
  async findForComposite(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<any> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Product,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference', 'displayName'],
      },
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readPaginatedListRecordForComposite(options, 1, 1000);
  }

  @ApiSearchQueryFilter()
  @Get('/list/forinventorycount')
  async findForInventoryCount(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<any> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Product,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference', 'displayName'],
      },
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    return this.service.readPaginatedListRecordForInventoryCount(
      options,
      1,
      10000,
    );
  }


  @ApiSearchQueryFilter()
  @Get('/list/stockadjustment')
  async findForStockAdjustment(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<any> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Product,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchParamOptions,
      {
        textFilterFields: ['reference', 'displayName'],
      },
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/
    return this.service.readPaginatedListRecordForStockAdjustment(
      options,
      1,
      1000,
    );
  }

  @ApiSearchOneQueryFilter()
  @Get(':productId')
  async findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('productId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Product> {
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    /*options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );*/

    const product = await this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: id ?? '' },
    });

    // Permission check
    await authUser?.throwUnlessCan(AbilityActionEnum.read, product);

    return product;
  }

  @ApiSearchQueryFilter()
  @Get('/new/sku')
  async newSkuValue(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<object> {
    return await this.service.generateNewSKUCode();
  }

  /**
   * Create product
   */
  @ApiSearchOneQueryFilter()
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: storageproducts,
      fileFilter: imageFileFilter,
      limits: limitsParams,
    }),
  )
  async create(
    @Body() dto: any,
    @Query() queryParams?: any,
    @UploadedFile() file?: any,
  ): Promise<Product> {
    const product = await this.service.createRecord(dto, file);
    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      queryParams as ApiSearchOneParamOptions,
    );

    // Apply auth user branch filter
    options.where = merge(
      options?.where,
      await this.service.getFilterByAuthUserBranch(),
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: product.id },
    });
  }

  /**
   * Update product
   */
  @ApiSearchOneQueryFilter()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: storageproducts,
      fileFilter: imageFileFilter,
      limits: limitsParams,
    }),
  )
  @Patch(':productId')
  async update(
    @Param('productId', ParseUUIDPipe) id: string,
    @Body() dto: any, //UpdateProductDto,
    @Query() query?: any,
    @UploadedFile() file?: any,
  ): Promise<Product> {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();
    const product = await this.service.updateRecord(
      { ...filter, id: id ?? '' },
      dto,
      file,
    );

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, ...filter, id: product.id ?? '' },
    });
  }

  /**
   * Remove product
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':productId')
  async remove(@Param('productId', ParseUUIDPipe) id: string) {
    // Apply auth user branch filter
    const filter = await this.service.getFilterByAuthUserBranch();

    await this.service.deleteRecord({ ...filter, id: id ?? '' });
    return;
  }
}
