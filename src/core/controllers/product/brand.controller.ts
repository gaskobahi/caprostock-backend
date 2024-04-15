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
import { AbilityActionEnum, AbilitySubjectEnum } from '../../definitions/enums';
import { BrandService } from '../../services/product/brand.service';
import { Brand } from '../../entities/product/brand.entity';
import { CreateBrandDto } from '../../dto/product/create-brand.dto';
import { UpdateBrandDto } from '../../dto/product/update-brand.dto';

@ApiAuthJwtHeader()
@ApiRequestIssuerHeader()
@CustomApiErrorResponse()
@ApiTags('brand')
@Controller('brand')
export class BrandController {
  constructor(private service: BrandService) {}

  /**
   * Get paginated brand list
   */
  @ApiSearchQueryFilter()
  @CustomApiPaginatedResponse(Brand)
  @Get()
  async findPaginated(
    @CurrentUser() authUser: AuthUser,
    @Query() query?: any,
  ): Promise<Paginated<Brand>> {
    // Permission check
    await authUser?.throwUnlessCan(
      AbilityActionEnum.read,
      AbilitySubjectEnum.Brand,
    );

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
   * Get brand by id
   */
  @ApiSearchOneQueryFilter()
  @Get(':brandId')
  async findOne(
    @Param('brandId', ParseUUIDPipe) id: string,
    @Query() query?: any,
  ): Promise<Brand> {
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
   * Create brand
   */
  @ApiSearchOneQueryFilter()
  @Post()
  async create(
    @Body() dto: CreateBrandDto,
    @Query() query?: any,
  ): Promise<Brand> {
    const brand = await this.service.createRecord(dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: brand.id },
    });
  }

  /**
   * Update brand
   */
  @ApiSearchOneQueryFilter()
  @Patch(':brandId')
  async update(
    @Param('brandId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
    @Query() query?: any,
  ): Promise<Brand> {
    const brand = await this.service.updateRecord({ id: id ?? '' }, dto);

    const options = buildFilterFromApiSearchParams(
      this.service.repository,
      query as ApiSearchOneParamOptions,
    );

    return this.service.readOneRecord({
      ...options,
      where: { ...options?.where, id: brand.id ?? '' },
    });
  }

  /**
   * Remove brand
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':brandId')
  async remove(@Param('brandId', ParseUUIDPipe) id: string) {
    await this.service.deleteRecord({ id: id ?? '' });
    return;
  }
}
